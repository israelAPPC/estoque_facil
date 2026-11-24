import type { SupabaseClient } from "@supabase/supabase-js";
import {
  type Loja,
  LojaErroDesconhecidoError,
  NomeDuplicadoError,
  type RepositorioLojas,
} from "./tipos";

const COLUNAS = "id, nome, ativo";
const CODIGO_VIOLACAO_UNICA = "23505";

function lancarErro(erro: { code?: string }): never {
  if (erro.code === CODIGO_VIOLACAO_UNICA) throw new NomeDuplicadoError();
  // Detalhe só no log do servidor; o serviço devolve mensagem genérica.
  console.error("Erro no repositório de lojas:", erro.code);
  throw new LojaErroDesconhecidoError();
}

export function criarRepositorioLojas(
  cliente: SupabaseClient,
): RepositorioLojas {
  return {
    async listar({ pagina, tamanho }) {
      const inicio = (pagina - 1) * tamanho;
      const { data, error, count } = await cliente
        .from("lojas")
        .select(COLUNAS, { count: "exact" })
        .order("nome", { ascending: true })
        .range(inicio, inicio + tamanho - 1);
      if (error) lancarErro(error);
      return { itens: (data ?? []) as Loja[], total: count ?? 0 };
    },
    async inserir(nome) {
      const { data, error } = await cliente
        .from("lojas")
        .insert({ nome })
        .select(COLUNAS)
        .single();
      if (error) lancarErro(error);
      return data as Loja;
    },
    async atualizarNome(id, nome) {
      const { data, error } = await cliente
        .from("lojas")
        .update({ nome })
        .eq("id", id)
        .select(COLUNAS)
        .maybeSingle();
      if (error) lancarErro(error);
      return (data as Loja | null) ?? null;
    },
    async obter(id) {
      const { data, error } = await cliente
        .from("lojas")
        .select(COLUNAS)
        .eq("id", id)
        .maybeSingle();
      if (error) lancarErro(error);
      return (data as Loja | null) ?? null;
    },
    async atualizarAtivo(id, ativo) {
      const { data, error } = await cliente
        .from("lojas")
        .update({ ativo })
        .eq("id", id)
        .select(COLUNAS)
        .maybeSingle();
      if (error) lancarErro(error);
      return (data as Loja | null) ?? null;
    },
  };
}
