import { z } from "zod";
import {
  type DadosProduto,
  type EntradaProduto,
  EntradaProdutoInvalidaError,
  MENSAGEM_ERRO_GENERICO,
  type Produto,
  validarProduto,
} from "./regras";

const esquemaId = z.string().uuid();
const esquemaAtivo = z.boolean();

function validarId(id: string): string {
  const r = esquemaId.safeParse(id);
  if (!r.success) {
    throw new EntradaProdutoInvalidaError({ geral: MENSAGEM_ERRO_GENERICO });
  }
  return r.data;
}

export const TAMANHO_PAGINA_PADRAO = 20;
export const TAMANHO_PAGINA_MAXIMO = 100;

export interface RepositorioProdutos {
  inserir(dados: DadosProduto): Promise<Produto>;
  atualizar(id: string, dados: DadosProduto): Promise<Produto>;
  definirAtivo(id: string, ativo: boolean): Promise<void>;
  listar(p: {
    deslocamento: number;
    limite: number;
  }): Promise<{ itens: Produto[]; total: number }>;
  obterProduto(id: string): Promise<Produto | null>;
}

export function obterProduto(
  repo: RepositorioProdutos,
  id: string,
): Promise<Produto | null> {
  return repo.obterProduto(id);
}

export async function criarProduto(
  repo: RepositorioProdutos,
  entrada: EntradaProduto,
): Promise<Produto> {
  return repo.inserir(validarProduto(entrada));
}

export async function editarProduto(
  repo: RepositorioProdutos,
  id: string,
  entrada: EntradaProduto,
): Promise<Produto> {
  const idValido = validarId(id);
  return repo.atualizar(idValido, validarProduto(entrada));
}

/** Produto nunca é excluído: só desativado ou reativado. */
export async function alterarAtivo(
  repo: RepositorioProdutos,
  id: string,
  ativo: boolean,
): Promise<void> {
  const idValido = validarId(id);
  const ativoValido = esquemaAtivo.safeParse(ativo);
  if (!ativoValido.success) {
    throw new EntradaProdutoInvalidaError({ geral: MENSAGEM_ERRO_GENERICO });
  }
  return repo.definirAtivo(idValido, ativoValido.data);
}

export async function listarProdutos(
  repo: RepositorioProdutos,
  { pagina, tamanho }: { pagina: number; tamanho: number },
) {
  const paginaOk = Number.isInteger(pagina) && pagina >= 1 ? pagina : 1;
  const limite = Math.min(
    Math.max(Number.isInteger(tamanho) ? tamanho : TAMANHO_PAGINA_PADRAO, 1),
    TAMANHO_PAGINA_MAXIMO,
  );
  const { itens, total } = await repo.listar({
    deslocamento: (paginaOk - 1) * limite,
    limite,
  });
  return {
    itens,
    total,
    pagina: paginaOk,
    totalPaginas: Math.max(1, Math.ceil(total / limite)),
  };
}
