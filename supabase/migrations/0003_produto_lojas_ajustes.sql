-- 0003_produto_lojas_ajustes.sql: ajustes da Task 2.4 pedidos na revisão.
-- Transação única e idempotente (create or replace). Não altera a 0002.
-- Decisões do usuário (2026-11-25):
--   * substituir vínculos só remove lojas ATIVAS; vínculo com loja desativada fica;
--   * loja ativada/reativada recebe todos os produtos ativos que faltam.
-- Erros: 22023 lista de lojas vazia; P0002 produto não encontrado;
-- 23505 SKU duplicado; 23514 campo inválido (check); 23503 loja inexistente.
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
create or replace function public.salvar_produto_com_lojas(
  p_produto_id uuid,
  p_sku text,
  p_nome text,
  p_categoria text,
  p_fator_caixa integer,
  p_estoque_minimo_unidades integer,
  p_ativo boolean,
  p_loja_ids uuid[]
)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if coalesce(cardinality(p_loja_ids), 0) = 0 then
    raise exception 'produto precisa de ao menos uma loja' using errcode = '22023';
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
      estoque_minimo_unidades = p_estoque_minimo_unidades,
      ativo = p_ativo
  where id = p_produto_id;

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
revoke execute on function public.salvar_produto_com_lojas(uuid, text, text, text, integer, integer, boolean, uuid[]) from public, anon;
grant execute on function public.salvar_produto_com_lojas(uuid, text, text, text, integer, integer, boolean, uuid[]) to authenticated;

-- ---------------------------------------------------------------- definir_lojas_produto
-- mesma assinatura da 0002; agora preserva vínculos de lojas desativadas
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
-- insert de loja ativa ou update de ativo false -> true: vincula produtos ativos que faltam
create or replace function public.vincular_produtos_loja_nova()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if new.ativo and (tg_op = 'INSERT' or not coalesce(old.ativo, false)) then
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
  after insert or update of ativo on public.lojas
  for each row execute function public.vincular_produtos_loja_nova();

commit;
