import type { SupabaseClient } from "@supabase/supabase-js";
import {
  type DadosProduto,
  LojasProdutoInvalidasError,
  type Produto,
  ProdutoErroDesconhecidoError,
  ProdutoNaoEncontradoError,
  SkuDuplicadoError,
} from "./regras";
import type { RepositorioProdutos } from "./servico";

const COLUNAS =
  "id, sku, nome, categoria, fator_caixa, estoque_minimo_unidades, ativo";
const CODIGO_VIOLACAO_UNICIDADE = "23505";
const CODIGO_NENHUMA_LINHA = "PGRST116";
const CODIGO_PRODUTO_NAO_ENCONTRADO = "P0002";
const CODIGO_PARAMETRO_INVALIDO = "22023";
const HINT_LOJAS_INVALIDAS = "lojas_invalidas";
const MENSAGEM_LOJAS_INDISPONIVEIS =
  "Uma ou mais lojas selecionadas não estão disponíveis. Recarregue a página.";

interface Linha {
  id: string;
  sku: string;
  nome: string;
  categoria: string | null;
  fator_caixa: number;
  estoque_minimo_unidades: number;
  ativo: boolean;
}

function paraDominio(l: Linha): Produto {
  return {
    id: l.id,
    sku: l.sku,
    nome: l.nome,
    categoria: l.categoria,
    fatorCaixa: l.fator_caixa,
    estoqueMinimo: l.estoque_minimo_unidades,
    ativo: l.ativo,
  };
}

/** Argumentos comuns das RPCs de produto (sem `ativo` nem lojas). */
function argumentosProduto(d: DadosProduto) {
  return {
    p_sku: d.sku,
    p_nome: d.nome,
    p_categoria: d.categoria,
    p_fator_caixa: d.fatorCaixa,
    p_estoque_minimo_unidades: d.estoqueMinimo,
  };
}

/** Traduz erro do banco; o detalhe vai só para o log do servidor. */
function traduzir(erro: {
  code?: string;
  message?: string;
  hint?: string;
}): never {
  if (erro.code === CODIGO_VIOLACAO_UNICIDADE) throw new SkuDuplicadoError();
  if (erro.code === CODIGO_PARAMETRO_INVALIDO) {
    throw erro.hint === HINT_LOJAS_INVALIDAS
      ? new LojasProdutoInvalidasError(MENSAGEM_LOJAS_INDISPONIVEIS)
      : new LojasProdutoInvalidasError();
  }
  if (
    erro.code === CODIGO_NENHUMA_LINHA ||
    erro.code === CODIGO_PRODUTO_NAO_ENCONTRADO
  )
    throw new ProdutoNaoEncontradoError();
  console.error("[produtos] falha no banco", erro.code);
  throw new ProdutoErroDesconhecidoError();
}

export function criarRepositorioProdutos(
  db: SupabaseClient,
): RepositorioProdutos {
  return {
    async criarComLojas(dados, lojaIds) {
      const { data, error } = await db.rpc("criar_produto_com_lojas", {
        ...argumentosProduto(dados),
        p_ativo: true,
        p_loja_ids: lojaIds,
      });
      if (error) traduzir(error);
      return { id: data as string, ativo: true, ...dados };
    },
    async salvarComLojas(id, dados, lojaIds) {
      // a RPC não recebe nem altera `ativo` e devolve a linha atualizada
      const { data, error } = await db.rpc("salvar_produto_com_lojas", {
        p_produto_id: id,
        ...argumentosProduto(dados),
        p_loja_ids: lojaIds,
      });
      if (error) traduzir(error);
      if (!data) throw new ProdutoNaoEncontradoError();
      return paraDominio(data as Linha);
    },
    async definirAtivo(id, ativo) {
      const { error } = await db
        .from("produtos")
        .update({ ativo })
        .eq("id", id);
      if (error) traduzir(error);
    },
    async listar({ deslocamento, limite }) {
      const { data, count, error } = await db
        .from("produtos")
        .select(COLUNAS, { count: "exact" })
        .order("nome")
        .range(deslocamento, deslocamento + limite - 1);
      if (error) traduzir(error);
      return {
        itens: (data as Linha[]).map(paraDominio),
        total: count ?? 0,
      };
    },
    async obterProduto(id) {
      const { data, error } = await db
        .from("produtos")
        .select(COLUNAS)
        .eq("id", id)
        .maybeSingle();
      if (error) traduzir(error);
      return data ? paraDominio(data as Linha) : null;
    },
    async listarLojasAtivas() {
      const { data, error } = await db
        .from("lojas")
        .select("id, nome")
        .eq("ativo", true)
        .order("nome");
      if (error) traduzir(error);
      return data as { id: string; nome: string }[];
    },
    async listarIdsLojasDoProduto(produtoId) {
      const { data, error } = await db
        .from("produto_lojas")
        .select("loja_id")
        .eq("produto_id", produtoId);
      if (error) traduzir(error);
      return (data as { loja_id: string }[]).map((v) => v.loja_id);
    },
    async listarPorLoja(lojaId, { deslocamento, limite }) {
      const { data, count, error } = await db
        .from("produtos")
        .select(`${COLUNAS}, produto_lojas!inner(loja_id)`, { count: "exact" })
        .eq("produto_lojas.loja_id", lojaId)
        .order("nome")
        .range(deslocamento, deslocamento + limite - 1);
      if (error) traduzir(error);
      return {
        itens: (data as Linha[]).map(paraDominio),
        total: count ?? 0,
      };
    },
  };
}
