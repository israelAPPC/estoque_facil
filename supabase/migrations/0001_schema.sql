-- 0001_schema.sql: schema inicial do EstoqueFácil.
-- Idempotente: pode ser executada mais de uma vez sem erro.
-- Quantidades sempre inteiras, na menor unidade (caixa/unidade só na exibição).
-- Acesso: só usuário autenticado; anon não tem permissão nem política.
-- Saldo (estoque_atual), requisições e confirmação de contagem mudam só por
-- função SQL security definer transacional (ADR 0001, tasks 3.x).

-- ---------------------------------------------------------------- lojas
create table if not exists public.lojas (
  id uuid primary key default gen_random_uuid(),
  nome text not null check (length(trim(nome)) > 0),
  ativo boolean not null default true,
  criado_em timestamptz not null default now()
);
-- nome único sem diferenciar maiúsculas nem espaços nas pontas
create unique index if not exists lojas_nome_unico_idx
  on public.lojas (lower(trim(nome)));

-- ---------------------------------------------------------------- produtos
create table if not exists public.produtos (
  id uuid primary key default gen_random_uuid(),
  sku text not null check (length(trim(sku)) > 0),
  nome text not null check (length(trim(nome)) > 0),
  categoria text,
  fator_caixa integer not null default 1 check (fator_caixa > 0),
  estoque_minimo_unidades integer not null default 0 check (estoque_minimo_unidades >= 0),
  ativo boolean not null default true,
  criado_em timestamptz not null default now()
);
-- SKU único sem diferenciar maiúsculas nem espaços nas pontas
create unique index if not exists produtos_sku_unico_idx
  on public.produtos (lower(trim(sku)));

-- ---------------------------------------------------------------- contagens
-- status: rascunho (editável) ou confirmada (imutável).
-- omitidos: escolha única da contagem para produtos não informados.
create table if not exists public.contagens (
  id uuid primary key default gen_random_uuid(),
  loja_id uuid not null references public.lojas (id) on delete restrict,
  data_contagem timestamptz not null,
  status text not null default 'rascunho' check (status in ('rascunho', 'confirmada')),
  omitidos text check (omitidos in ('manter', 'zerar')),
  inicial boolean not null default false,
  confirmada_em timestamptz,
  criado_por uuid not null references auth.users (id) on delete restrict,
  criado_em timestamptz not null default now(),
  check ((status = 'confirmada') = (confirmada_em is not null)),
  check (status <> 'confirmada' or omitidos is not null)
);
create index if not exists contagens_loja_data_idx
  on public.contagens (loja_id, data_contagem desc);
-- no máximo uma contagem inicial (estoque inicial) por loja
create unique index if not exists contagens_inicial_unica_idx
  on public.contagens (loja_id) where inicial;

create table if not exists public.contagem_itens (
  contagem_id uuid not null,
  produto_id uuid not null references public.produtos (id) on delete restrict,
  quantidade_unidades integer not null check (quantidade_unidades >= 0),
  primary key (contagem_id, produto_id)
);
-- FK com nome explícito e restrict (nunca cascade): apagar um rascunho exige
-- apagar os itens antes. Drop + add mantém a migração idempotente, inclusive
-- em banco onde a FK antiga (cascade) já existe.
alter table public.contagem_itens drop constraint if exists contagem_itens_contagem_id_fkey;
alter table public.contagem_itens
  add constraint contagem_itens_contagem_id_fkey
  foreign key (contagem_id) references public.contagens (id) on delete restrict;
create index if not exists contagem_itens_produto_idx
  on public.contagem_itens (produto_id);

-- ---------------------------------------------------------------- requisições
-- tipo consumo: só loja_id. tipo transferencia: loja_id = origem, loja_destino_id = destino.
create table if not exists public.requisicoes (
  id uuid primary key default gen_random_uuid(),
  tipo text not null check (tipo in ('consumo', 'transferencia')),
  loja_id uuid not null references public.lojas (id) on delete restrict,
  loja_destino_id uuid references public.lojas (id) on delete restrict,
  data_movimento timestamptz not null,
  observacao text,
  criado_por uuid not null references auth.users (id) on delete restrict,
  criado_em timestamptz not null default now(),
  check (
    (tipo = 'consumo' and loja_destino_id is null)
    or (tipo = 'transferencia' and loja_destino_id is not null
        and loja_destino_id is distinct from loja_id)
  )
);
create index if not exists requisicoes_loja_data_idx
  on public.requisicoes (loja_id, data_movimento desc);
create index if not exists requisicoes_destino_data_idx
  on public.requisicoes (loja_destino_id, data_movimento desc)
  where loja_destino_id is not null;

create table if not exists public.requisicao_itens (
  requisicao_id uuid not null references public.requisicoes (id) on delete restrict,
  produto_id uuid not null references public.produtos (id) on delete restrict,
  quantidade_unidades integer not null check (quantidade_unidades > 0),
  primary key (requisicao_id, produto_id)
);
create index if not exists requisicao_itens_produto_idx
  on public.requisicao_itens (produto_id);

-- ---------------------------------------------------------------- estoque_atual
-- Saldo materializado por loja/produto. Pode ficar negativo (aviso na aplicação).
create table if not exists public.estoque_atual (
  loja_id uuid not null references public.lojas (id) on delete restrict,
  produto_id uuid not null references public.produtos (id) on delete restrict,
  quantidade_unidades integer not null default 0,
  atualizado_em timestamptz not null default now(),
  primary key (loja_id, produto_id)
);
create index if not exists estoque_atual_produto_idx
  on public.estoque_atual (produto_id);

-- ---------------------------------------------------------------- autor (criado_por)
-- O autor vem sempre de auth.uid(); valor enviado pelo cliente é ignorado
-- no insert e o autor original é preservado no update.
create or replace function public.definir_criado_por()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    new.criado_por := auth.uid();
  else
    new.criado_por := old.criado_por;
  end if;
  return new;
end;
$$;
revoke execute on function public.definir_criado_por() from public, anon, authenticated;

drop trigger if exists contagens_definir_criado_por on public.contagens;
create trigger contagens_definir_criado_por
  before insert or update on public.contagens
  for each row execute function public.definir_criado_por();

drop trigger if exists requisicoes_definir_criado_por on public.requisicoes;
create trigger requisicoes_definir_criado_por
  before insert or update on public.requisicoes
  for each row execute function public.definir_criado_por();

-- ---------------------------------------------------------------- RLS e permissões
alter table public.lojas enable row level security;
alter table public.produtos enable row level security;
alter table public.contagens enable row level security;
alter table public.contagem_itens enable row level security;
alter table public.requisicoes enable row level security;
alter table public.requisicao_itens enable row level security;
alter table public.estoque_atual enable row level security;

revoke all on table public.lojas from anon;
revoke all on table public.produtos from anon;
revoke all on table public.contagens from anon;
revoke all on table public.contagem_itens from anon;
revoke all on table public.requisicoes from anon;
revoke all on table public.requisicao_itens from anon;
revoke all on table public.estoque_atual from anon;

revoke all on table public.lojas from authenticated;
revoke all on table public.produtos from authenticated;
revoke all on table public.contagens from authenticated;
revoke all on table public.contagem_itens from authenticated;
revoke all on table public.requisicoes from authenticated;
revoke all on table public.requisicao_itens from authenticated;
revoke all on table public.estoque_atual from authenticated;

grant select, insert, update on table public.lojas to authenticated;
grant select, insert, update on table public.produtos to authenticated;
grant select, insert, update, delete on table public.contagens to authenticated;
grant select, insert, update, delete on table public.contagem_itens to authenticated;
-- requisições: gravação só por função security definer (ADR 0001, task 3.2)
grant select on table public.requisicoes to authenticated;
grant select on table public.requisicao_itens to authenticated;
grant select on table public.estoque_atual to authenticated;

-- lojas: sem delete (desativar via ativo = false)
drop policy if exists lojas_select on public.lojas;
create policy lojas_select on public.lojas
  for select to authenticated using (true);
drop policy if exists lojas_insert on public.lojas;
create policy lojas_insert on public.lojas
  for insert to authenticated with check (true);
drop policy if exists lojas_update on public.lojas;
create policy lojas_update on public.lojas
  for update to authenticated using (true) with check (true);

-- produtos: sem delete (desativar via ativo = false)
drop policy if exists produtos_select on public.produtos;
create policy produtos_select on public.produtos
  for select to authenticated using (true);
drop policy if exists produtos_insert on public.produtos;
create policy produtos_insert on public.produtos
  for insert to authenticated with check (true);
drop policy if exists produtos_update on public.produtos;
create policy produtos_update on public.produtos
  for update to authenticated using (true) with check (true);

-- contagens: cliente cria e altera só rascunho; confirmar é função SQL (task 3.x)
drop policy if exists contagens_select on public.contagens;
create policy contagens_select on public.contagens
  for select to authenticated using (true);
drop policy if exists contagens_insert on public.contagens;
create policy contagens_insert on public.contagens
  for insert to authenticated with check (status = 'rascunho' and not inicial);
drop policy if exists contagens_update on public.contagens;
create policy contagens_update on public.contagens
  for update to authenticated
  using (status = 'rascunho') with check (status = 'rascunho' and not inicial);
drop policy if exists contagens_delete on public.contagens;
create policy contagens_delete on public.contagens
  for delete to authenticated using (status = 'rascunho');

-- contagem_itens: só enquanto a contagem está em rascunho
drop policy if exists contagem_itens_select on public.contagem_itens;
create policy contagem_itens_select on public.contagem_itens
  for select to authenticated using (true);
drop policy if exists contagem_itens_insert on public.contagem_itens;
create policy contagem_itens_insert on public.contagem_itens
  for insert to authenticated with check (exists (
    select 1 from public.contagens c
    where c.id = contagem_id and c.status = 'rascunho'));
drop policy if exists contagem_itens_update on public.contagem_itens;
create policy contagem_itens_update on public.contagem_itens
  for update to authenticated
  using (exists (
    select 1 from public.contagens c
    where c.id = contagem_id and c.status = 'rascunho'))
  with check (exists (
    select 1 from public.contagens c
    where c.id = contagem_id and c.status = 'rascunho'));
drop policy if exists contagem_itens_delete on public.contagem_itens;
create policy contagem_itens_delete on public.contagem_itens
  for delete to authenticated using (exists (
    select 1 from public.contagens c
    where c.id = contagem_id and c.status = 'rascunho'));

-- requisições: só leitura para o cliente; gravação por função (ADR 0001)
drop policy if exists requisicoes_insert on public.requisicoes;
drop policy if exists requisicoes_select on public.requisicoes;
create policy requisicoes_select on public.requisicoes
  for select to authenticated using (true);

drop policy if exists requisicao_itens_insert on public.requisicao_itens;
drop policy if exists requisicao_itens_select on public.requisicao_itens;
create policy requisicao_itens_select on public.requisicao_itens
  for select to authenticated using (true);

-- estoque_atual: só leitura
drop policy if exists estoque_atual_select on public.estoque_atual;
create policy estoque_atual_select on public.estoque_atual
  for select to authenticated using (true);
