import {
  type DadosProduto,
  EntradaProdutoInvalidaError,
  validarProduto,
} from "./regras";
import { paraCaixas, paraUnidades } from "./unidades";

const MENSAGEM_INTEIRO = "Informe um número inteiro maior ou igual a 0.";

export interface ResultadoFormulario {
  dados: DadosProduto | null;
  erros: Record<string, string>;
}

function texto(fd: FormData, campo: string): string {
  const v = fd.get(campo);
  return typeof v === "string" ? v.trim() : "";
}

/** Vazio vira o padrão; qualquer outra coisa vira número (NaN se inválido). */
function numero(fd: FormData, campo: string, padrao: number): number {
  const t = texto(fd, campo);
  return t === "" ? padrao : Number(t);
}

function quantidadeValida(n: number): boolean {
  return Number.isSafeInteger(n) && n >= 0;
}

/** Lê o formulário de produto; o mínimo entra em caixas + unidades e sai na menor unidade. */
export function lerFormularioProduto(fd: FormData): ResultadoFormulario {
  const erros: Record<string, string> = {};
  const fator = numero(fd, "fatorCaixa", 1);
  const caixas = numero(fd, "minimoCaixas", 0);
  const unidades = numero(fd, "minimoUnidades", 0);

  if (!quantidadeValida(caixas)) erros.minimoCaixas = MENSAGEM_INTEIRO;
  if (!quantidadeValida(unidades)) erros.minimoUnidades = MENSAGEM_INTEIRO;

  const fatorOk = Number.isSafeInteger(fator) && fator >= 1;
  const minimo =
    !erros.minimoCaixas && !erros.minimoUnidades && fatorOk
      ? paraUnidades(caixas, unidades, fator)
      : 0;

  try {
    const dados = validarProduto({
      nome: texto(fd, "nome"),
      sku: texto(fd, "sku"),
      categoria: texto(fd, "categoria"),
      fatorCaixa: fator,
      estoqueMinimo: minimo,
    });
    if (Object.keys(erros).length > 0) return { dados: null, erros };
    return { dados, erros };
  } catch (e) {
    if (!(e instanceof EntradaProdutoInvalidaError)) throw e;
    return { dados: null, erros: { ...e.erros, ...erros } };
  }
}

/** Texto de exibição de uma quantidade na menor unidade ("3 cx + 10 un"). */
export function descreverEstoqueMinimo(total: number, fator: number): string {
  if (fator <= 1) return `${total} un`;
  const { caixas, unidades } = paraCaixas(total, fator);
  return `${caixas} cx + ${unidades} un`;
}
