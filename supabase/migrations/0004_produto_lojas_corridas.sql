-- 0004_produto_lojas_corridas.sql: correções de corrida da Task 2.4 (revisão, 3ª rodada).
-- Transação única e idempotente. Não altera 0002/0003.
--   * salvar_produto_com_lojas deixa de receber/alterar ativo (evita lost update);
--     devolve a linha atualizada de public.produtos;
--   * salvar: p_loja_ids nulo = mantém vínculos; vazio = erro 22023;
--   * criar/salvar/definir só aceitam lojas ativas existentes (22023, hint 'lojas_invalidas');
--   * trigger de lojas separado em insert e update of ativo, com when.
-- Erros: 22023 lista vazia ou lojas inválidas; P0002 produto não encontrado;
-- 23505 SKU duplicado; 23514 campo inválido (check).
begin;

-- ---------------------------------------------------------------- criação atômica
create or replace function public.criar_produto_com_lojas(
  p_sku text,
  p_nome text,
  p_categoria text,
  p_fator_caixa integer,
  p_estoque_minimo_unidades integer,
  p_ativo boolean,
  p_loja_ids uuid[]
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_id uuid;
begin
  if coalesce(cardinality(p_loja_ids), 0) = 0 then
    raise exception 'produto precisa de ao menos uma loja' using errcode = '22023';
  end if;

  if exists (
    select 1 from unnest(p_loja_ids) as l
    where l is null or not exists (
      select 1 from public.lojas lj where lj.id = l and lj.ativo
    )
  ) then
    raise exception 'loja inexistente ou inativa' using errcode = '22023', hint = 'lojas_invalidas';
  end if;

  insert into public.produtos (sku, nome, categoria, fator_caixa, estoque_minimo_unidades, ativo)
  values (p_sku, p_nome, p_categoria, p_fator_caixa, p_estoque_minimo_unidades, p_ativo)
  returning id into v_id;

  insert into public.produto_lojas (produto_id, loja_id)
  select distinct v_id, l
  from unnest(p_loja_ids) as l
  on conflict (produto_id, loja_id) do nothing;

  return v_id;
end;
$$;
revoke execute on function public.criar_produto_com_lojas(text, text, text, integer, integer, boolean, uuid[]) from public, anon;
grant execute on function public.criar_produto_com_lojas(text, text, text, integer, integer, boolean, uuid[]) to authenticated;

-- ---------------------------------------------------------------- edição atômica
-- assinatura antiga (com p_ativo) sai para não ficar sobrecarga
drop function if exists public.salvar_produto_com_lojas(uuid, text, text, text, integer, integer, boolean, uuid[]);

create or replace function public.salvar_produto_com_lojas(
  p_produto_id uuid,
  p_sku text,
  p_nome text,
  p_categoria text,
  p_fator_caixa integer,
  p_estoque_minimo_unidades integer,
  p_loja_ids uuid[]
)
returns public.produtos
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_produto public.produtos;
begin
  if p_loja_ids is not null and cardinality(p_loja_ids) = 0 then
    raise exception 'produto precisa de ao menos uma loja' using errcode = '22023';
  end if;

  if p_loja_ids is not null and exists (
    select 1 from unnest(p_loja_ids) as l
    where l is null or not exists (
      select 1 from public.lojas lj where lj.id = l and lj.ativo
    )
  ) then
    raise exception 'loja inexistente ou inativa' using errcode = '22023', hint = 'lojas_invalidas';
  end if;

  -- trava o produto: edições simultâneas do mesmo produto ficam em fila
  perform 1 from public.produtos where id = p_produto_id for update;
  if not found then
    raise exception 'produto não encontrado' using errcode = 'P0002';
  end if;

  update public.produtos
  set sku = p_sku,
      nome = p_nome,
      categoria = p_categoria,
      fator_caixa = p_fator_caixa,
      estoque_minimo_unidades = p_estoque_minimo_unidades
  where id = p_produto_id
  returning * into v_produto;

  -- nulo: mantém vínculos como estão
  if p_loja_ids is not null then
    delete from public.produto_lojas
    where produto_id = p_produto_id
      and loja_id <> all (p_loja_ids)
      and loja_id in (select id from public.lojas where ativo);

    insert into public.produto_lojas (produto_id, loja_id)
    select distinct p_produto_id, l
    from unnest(p_loja_ids) as l
    on conflict (produto_id, loja_id) do nothing;
  end if;

  return v_produto;
end;
$$;
revoke execute on function public.salvar_produto_com_lojas(uuid, text, text, text, integer, integer, uuid[]) from public, anon;
grant execute on function public.salvar_produto_com_lojas(uuid, text, text, text, integer, integer, uuid[]) to authenticated;

-- ---------------------------------------------------------------- definir_lojas_produto
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

  if exists (
    select 1 from unnest(p_loja_ids) as l
    where l is null or not exists (
      select 1 from public.lojas lj where lj.id = l and lj.ativo
    )
  ) then
    raise exception 'loja inexistente ou inativa' using errcode = '22023', hint = 'lojas_invalidas';
  end if;

  perform 1 from public.produtos where id = p_produto_id for update;
  if not found then
    raise exception 'produto não encontrado' using errcode = 'P0002';
  end if;

  delete from public.produto_lojas
  where produto_id = p_produto_id
    and loja_id <> all (p_loja_ids)
    and loja_id in (select id from public.lojas where ativo);

  insert into public.produto_lojas (produto_id, loja_id)
  select distinct p_produto_id, l
  from unnest(p_loja_ids) as l
  on conflict (produto_id, loja_id) do nothing;
end;
$$;
revoke execute on function public.definir_lojas_produto(uuid, uuid[]) from public, anon;
grant execute on function public.definir_lojas_produto(uuid, uuid[]) to authenticated;

-- ---------------------------------------------------------------- loja nova ou reativada
-- a condição fica no when dos triggers; a função só vincula
create or replace function public.vincular_produtos_loja_nova()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  insert into public.produto_lojas (produto_id, loja_id)
  select p.id, new.id
  from public.produtos p
  where p.ativo
  on conflict (produto_id, loja_id) do nothing;
  return null;
end;
$$;
revoke execute on function public.vincular_produtos_loja_nova() from public, anon, authenticated;

drop trigger if exists lojas_vincular_produtos on public.lojas;
drop trigger if exists lojas_vincular_produtos_insert on public.lojas;
drop trigger if exists lojas_vincular_produtos_reativar on public.lojas;

create trigger lojas_vincular_produtos_insert
  after insert on public.lojas
  for each row when (new.ativo)
  execute function public.vincular_produtos_loja_nova();

create trigger lojas_vincular_produtos_reativar
  after update of ativo on public.lojas
  for each row when (new.ativo and old.ativo is distinct from true)
  execute function public.vincular_produtos_loja_nova();

commit;
