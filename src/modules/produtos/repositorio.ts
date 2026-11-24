import type { SupabaseClient } from "@supabase/supabase-js";
import {
  type DadosProduto,
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

function paraLinha(d: DadosProduto) {
  return {
    sku: d.sku,
    nome: d.nome,
    categoria: d.categoria,
    fator_caixa: d.fatorCaixa,
    estoque_minimo_unidades: d.estoqueMinimo,
  };
}

/** Traduz erro do banco; o detalhe vai só para o log do servidor. */
function traduzir(erro: { code?: string; message?: string }): never {
  if (erro.code === CODIGO_VIOLACAO_UNICIDADE) throw new SkuDuplicadoError();
  if (erro.code === CODIGO_NENHUMA_LINHA) throw new ProdutoNaoEncontradoError();
  console.error("[produtos] falha no banco", erro.code);
  throw new ProdutoErroDesconhecidoError();
}

export function criarRepositorioProdutos(
  db: SupabaseClient,
): RepositorioProdutos {
  return {
    async inserir(dados) {
      const { data, error } = await db
        .from("produtos")
        .insert(paraLinha(dados))
        .select(COLUNAS)
        .single();
      if (error) traduzir(error);
      return paraDominio(data as Linha);
    },
    async atualizar(id, dados) {
      const { data, error } = await db
        .from("produtos")
        .update(paraLinha(dados))
        .eq("id", id)
        .select(COLUNAS)
        .single();
      if (error) traduzir(error);
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
  };
}
