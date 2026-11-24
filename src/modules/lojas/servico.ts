import { z } from "zod";
import {
  type Loja,
  MENSAGEM_ERRO_GENERICO,
  NomeDuplicadoError,
  type RepositorioLojas,
} from "./tipos";

export { MENSAGEM_ERRO_GENERICO };

export const MENSAGEM_NOME_OBRIGATORIO = "Informe o nome da loja.";
export const MENSAGEM_NOME_LONGO = "O nome da loja deve ter até 80 caracteres.";
export const MENSAGEM_NOME_DUPLICADO = "Já existe uma loja com esse nome.";
export const MENSAGEM_LOJA_INEXISTENTE = "Loja não encontrada.";

export const TAMANHO_NOME_MAXIMO = 80;
export const TAMANHO_PAGINA_PADRAO = 20;

const esquemaId = z.string().uuid();
const esquemaAtivo = z.boolean();

export const esquemaLoja = z.object({
  nome: z
    .string()
    .trim()
    .min(1, MENSAGEM_NOME_OBRIGATORIO)
    .max(TAMANHO_NOME_MAXIMO, MENSAGEM_NOME_LONGO),
});

export type EntradaLoja = z.input<typeof esquemaLoja>;

export interface ErrosLoja {
  nome?: string;
  geral?: string;
}

export type ResultadoLoja =
  | { ok: true; loja: Loja }
  | { ok: false; erros: ErrosLoja };

export interface PaginaLojas {
  itens: Loja[];
  total: number;
  pagina: number;
  totalPaginas: number;
}

function falha(erros: ErrosLoja): ResultadoLoja {
  return { ok: false, erros };
}

async function executar(
  operacao: () => Promise<Loja | null>,
): Promise<ResultadoLoja> {
  try {
    const loja = await operacao();
    if (!loja) return falha({ geral: MENSAGEM_LOJA_INEXISTENTE });
    return { ok: true, loja };
  } catch (erro) {
    if (erro instanceof NomeDuplicadoError) {
      return falha({ nome: MENSAGEM_NOME_DUPLICADO });
    }
    return falha({ geral: MENSAGEM_ERRO_GENERICO });
  }
}

export async function criarLoja(
  repo: RepositorioLojas,
  entrada: EntradaLoja,
): Promise<ResultadoLoja> {
  const dados = esquemaLoja.safeParse(entrada);
  if (!dados.success) {
    return falha({ nome: dados.error.issues[0]?.message });
  }
  return executar(() => repo.inserir(dados.data.nome));
}

export async function editarLoja(
  repo: RepositorioLojas,
  id: string,
  entrada: EntradaLoja,
): Promise<ResultadoLoja> {
  const idValido = esquemaId.safeParse(id);
  if (!idValido.success) return falha({ geral: MENSAGEM_ERRO_GENERICO });
  const dados = esquemaLoja.safeParse(entrada);
  if (!dados.success) {
    return falha({ nome: dados.error.issues[0]?.message });
  }
  return executar(() => repo.atualizarNome(idValido.data, dados.data.nome));
}

/** Loja nunca é excluída: só desativada (ou reativada). */
export async function definirAtivoLoja(
  repo: RepositorioLojas,
  id: string,
  ativo: boolean,
): Promise<ResultadoLoja> {
  const idValido = esquemaId.safeParse(id);
  const ativoValido = esquemaAtivo.safeParse(ativo);
  if (!idValido.success || !ativoValido.success) {
    return falha({ geral: MENSAGEM_ERRO_GENERICO });
  }
  return executar(() => repo.atualizarAtivo(idValido.data, ativoValido.data));
}

/** Busca uma loja pelo id; null se o id for inválido ou a loja não existir. */
export async function obterLoja(
  repo: RepositorioLojas,
  id: string,
): Promise<Loja | null> {
  const idValido = esquemaId.safeParse(id);
  if (!idValido.success) return null;
  return repo.obter(idValido.data);
}

export async function listarLojas(
  repo: RepositorioLojas,
  { pagina }: { pagina: number },
): Promise<PaginaLojas> {
  const paginaValida = Number.isSafeInteger(pagina) && pagina >= 1 ? pagina : 1;
  const { itens, total } = await repo.listar({
    pagina: paginaValida,
    tamanho: TAMANHO_PAGINA_PADRAO,
  });
  return {
    itens,
    total,
    pagina: paginaValida,
    totalPaginas: Math.max(1, Math.ceil(total / TAMANHO_PAGINA_PADRAO)),
  };
}
