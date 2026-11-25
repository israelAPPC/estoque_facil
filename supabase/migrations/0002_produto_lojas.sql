-- 0002_produto_lojas.sql: em quais lojas cada produto existe (Task 2.4).
-- Transação única e idempotente: pode rodar mais de uma vez sem duplicar.
-- Decisões do usuário (2026-11-24): produtos existentes vão para todas as
-- lojas ativas; loja nova recebe todos os produtos ativos (trigger); produto
-- novo com todas as lojas é feito pelo app; produto precisa de ao menos uma loja.
begin;

-- ---------------------------------------------------------------- produto_lojas
create table if not exists public.produto_lojas (
  produto_id uuid not null references public.produtos (id) on delete restrict,
  loja_id uuid not null references public.lojas (id) on delete restrict,
  criado_em timestamptz not null default now(),
  primary key (produto_id, loja_id)
);
-- listar produtos de uma loja (a PK já atende a busca por produto)
create index if not exists produto_lojas_loja_idx
  on public.produto_lojas (loja_id);

-- ---------------------------------------------------------------- RLS e permissões
alter table public.produto_lojas enable row level security;
revoke all on table public.produto_lojas from anon;
revoke all on table public.produto_lojas from authenticated;
grant select, insert, delete on table public.produto_lojas to authenticated;

drop policy if exists produto_lojas_select on public.produto_lojas;
create policy produto_lojas_select on public.produto_lojas
  for select to authenticated using (true);
drop policy if exists produto_lojas_insert on public.produto_lojas;
create policy produto_lojas_insert on public.produto_lojas
  for insert to authenticated with check (true);
drop policy if exists produto_lojas_delete on public.produto_lojas;
create policy produto_lojas_delete on public.produto_lojas
  for delete to authenticated using (true);

-- ---------------------------------------------------------------- backfill
-- todo produto já cadastrado passa a existir em todas as lojas ativas
insert into public.produto_lojas (produto_id, loja_id)
select p.id, l.id
from public.produtos p
cross join public.lojas l
where l.ativo
on conflict (produto_id, loja_id) do nothing;

-- ---------------------------------------------------------------- loja nova
-- loja criada já ativa recebe todos os produtos ativos
create or replace function public.vincular_produtos_loja_nova()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if new.ativo then
    insert into public.produto_lojas (produto_id, loja_id)
    select p.id, new.id
    from public.produtos p
    where p.ativo
    on conflict (produto_id, loja_id) do nothing;
  end if;
  return null;
end;
$$;
revoke execute on function public.vincular_produtos_loja_nova() from public, anon, authenticated;

drop trigger if exists lojas_vincular_produtos on public.lojas;
create trigger lojas_vincular_produtos
  after insert on public.lojas
  for each row execute function public.vincular_produtos_loja_nova();

-- ---------------------------------------------------------------- RPC
-- Substitui o conjunto de lojas de um produto numa transação: remove as
-- desmarcadas e insere as marcadas. Lista vazia é rejeitada (22023).
-- Produto inexistente: P0002. Loja inexistente: erro de FK (23503).
create or replace function public.definir_lojas_produto(p_produto_id uuid, p_loja_ids uuid[])
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if coalesce(cardinality(p_loja_ids), 0) = 0 then
    raise exception 'produto precisa de ao menos uma loja' using errcode = '22023';
  end if;

  -- trava o produto: chamadas simultâneas para o mesmo produto ficam em fila
  perform 1 from public.produtos where id = p_produto_id for update;
  if not found then
    raise exception 'produto não encontrado' using errcode = 'P0002';
  end if;

  delete from public.produto_lojas
  where produto_id = p_produto_id
    and loja_id <> all (p_loja_ids);

  insert into public.produto_lojas (produto_id, loja_id)
  select distinct p_produto_id, l
  from unnest(p_loja_ids) as l
  on conflict (produto_id, loja_id) do nothing;
end;
$$;
revoke execute on function public.definir_lojas_produto(uuid, uuid[]) from public, anon;
grant execute on function public.definir_lojas_produto(uuid, uuid[]) to authenticated;

commit;
