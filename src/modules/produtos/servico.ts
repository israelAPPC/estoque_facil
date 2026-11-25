import { z } from "zod";
import {
  type DadosProduto,
  type EntradaProduto,
  EntradaProdutoInvalidaError,
  LojasProdutoInvalidasError,
  MENSAGEM_ERRO_GENERICO,
  type Produto,
  validarLojasProduto,
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

export interface LojaOpcao {
  id: string;
  nome: string;
}

export const TAMANHO_PAGINA_PADRAO = 20;
export const TAMANHO_PAGINA_MAXIMO = 100;

export interface RepositorioProdutos {
  /** Cria produto e vínculos com lojas numa só chamada (RPC, transação única). */
  criarComLojas(dados: DadosProduto, lojaIds: string[]): Promise<Produto>;
  /**
   * Atualiza produto e substitui lojas numa só chamada (RPC, transação única).
   * `lojaIds` nulo mantém os vínculos; não altera `ativo`. Devolve a linha salva.
   */
  salvarComLojas(
    id: string,
    dados: DadosProduto,
    lojaIds: string[] | null,
  ): Promise<Produto>;
  definirAtivo(id: string, ativo: boolean): Promise<void>;
  listar(p: {
    deslocamento: number;
    limite: number;
  }): Promise<{ itens: Produto[]; total: number }>;
  obterProduto(id: string): Promise<Produto | null>;
  listarLojasAtivas(): Promise<LojaOpcao[]>;
  listarIdsLojasDoProduto(produtoId: string): Promise<string[]>;
  listarPorLoja(
    lojaId: string,
    p: { deslocamento: number; limite: number },
  ): Promise<{ itens: Produto[]; total: number }>;
}

export function obterProduto(
  repo: RepositorioProdutos,
  id: string,
): Promise<Produto | null> {
  return repo.obterProduto(id);
}

/** Sem `lojaIds`, o produto novo vem com todas as lojas ativas marcadas. */
export async function criarProduto(
  repo: RepositorioProdutos,
  entrada: EntradaProduto,
  lojaIds?: string[],
): Promise<Produto> {
  const dados = validarProduto(entrada);
  const lojas = validarLojasProduto(
    lojaIds ?? (await repo.listarLojasAtivas()).map((l) => l.id),
  );
  return repo.criarComLojas(dados, lojas);
}

/** Com `lojaIds`, o conjunto é substituído; sem ele, os vínculos são mantidos (nulo). */
export async function editarProduto(
  repo: RepositorioProdutos,
  id: string,
  entrada: EntradaProduto,
  lojaIds?: string[],
): Promise<Produto> {
  const idValido = validarId(id);
  const dados = validarProduto(entrada);
  const lojas = lojaIds === undefined ? null : validarLojasProduto(lojaIds);
  return repo.salvarComLojas(idValido, dados, lojas);
}

/** Lojas ativas, para os checkboxes do cadastro. */
export async function listarLojasAtivas(
  repo: RepositorioProdutos,
): Promise<LojaOpcao[]> {
  return repo.listarLojasAtivas();
}

/** Lojas vinculadas ao produto, para pré-marcar o formulário. */
export async function obterLojasDoProduto(
  repo: RepositorioProdutos,
  produtoId: string,
): Promise<string[]> {
  return repo.listarIdsLojasDoProduto(validarId(produtoId));
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

/** Produtos vinculados a uma loja (usado por contagem, requisição e estoque). */
export async function listarProdutosPorLoja(
  repo: RepositorioProdutos,
  lojaId: string,
  {
    pagina,
    tamanho = TAMANHO_PAGINA_PADRAO,
  }: { pagina: number; tamanho?: number },
) {
  const idLoja = esquemaId.safeParse(lojaId);
  if (!idLoja.success)
    throw new LojasProdutoInvalidasError(MENSAGEM_ERRO_GENERICO);
  const paginaOk = Number.isInteger(pagina) && pagina >= 1 ? pagina : 1;
  const limite = Math.min(
    Math.max(Number.isInteger(tamanho) ? tamanho : TAMANHO_PAGINA_PADRAO, 1),
    TAMANHO_PAGINA_MAXIMO,
  );
  const { itens, total } = await repo.listarPorLoja(idLoja.data, {
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
