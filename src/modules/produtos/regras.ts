import { z } from "zod";

export const MENSAGEM_SKU_DUPLICADO =
  "Já existe um produto com este código (SKU).";
export const MENSAGEM_ERRO_GENERICO =
  "Não foi possível concluir a operação. Tente novamente.";

export class SkuDuplicadoError extends Error {
  constructor() {
    super(MENSAGEM_SKU_DUPLICADO);
    this.name = "SkuDuplicadoError";
  }
}

export const MENSAGEM_PRODUTO_NAO_ENCONTRADO = "Produto não encontrado.";

export class ProdutoNaoEncontradoError extends Error {
  constructor() {
    super(MENSAGEM_PRODUTO_NAO_ENCONTRADO);
    this.name = "ProdutoNaoEncontradoError";
  }
}

export class EntradaProdutoInvalidaError extends Error {
  constructor(public readonly erros: Record<string, string>) {
    super("Dados do produto inválidos.");
    this.name = "EntradaProdutoInvalidaError";
  }
}

export class ProdutoErroDesconhecidoError extends Error {
  constructor() {
    super(MENSAGEM_ERRO_GENERICO);
    this.name = "ProdutoErroDesconhecidoError";
  }
}

const inteiro = (msg: string) => z.number({ message: msg }).int(msg);

const FATOR_CAIXA_MAXIMO = 100_000;
const ESTOQUE_MINIMO_MAXIMO = 1_000_000_000;

export const esquemaProduto = z.object({
  nome: z
    .string()
    .trim()
    .min(1, "Informe o nome.")
    .max(120, "Nome muito longo."),
  sku: z
    .string()
    .trim()
    .min(1, "Informe o código (SKU).")
    .max(60, "Código muito longo."),
  categoria: z
    .string()
    .trim()
    .max(60, "Categoria muito longa.")
    .optional()
    .transform((v) => (v ? v : null)),
  fatorCaixa: inteiro("Informe um número inteiro maior que 0.")
    .min(1, "Informe um número inteiro maior que 0.")
    .max(FATOR_CAIXA_MAXIMO, "Fator muito alto.")
    .default(1),
  estoqueMinimo: inteiro("Informe um número inteiro maior ou igual a 0.")
    .min(0, "Informe um número inteiro maior ou igual a 0.")
    .max(ESTOQUE_MINIMO_MAXIMO, "Valor muito alto.")
    .default(0),
});

export type EntradaProduto = z.input<typeof esquemaProduto>;
export type DadosProduto = z.output<typeof esquemaProduto>;

export interface Produto extends DadosProduto {
  id: string;
  ativo: boolean;
}

/** Valida a entrada; devolve dados normalizados ou lança erro tipado com mensagem por campo. */
export function validarProduto(entrada: EntradaProduto): DadosProduto {
  const r = esquemaProduto.safeParse(entrada);
  if (r.success) return r.data;
  const erros: Record<string, string> = {};
  for (const i of r.error.issues) {
    const campo = String(i.path[0] ?? "geral");
    erros[campo] ??= i.message;
  }
  throw new EntradaProdutoInvalidaError(erros);
}

export const MENSAGEM_NENHUMA_LOJA = "Marque ao menos uma loja para o produto.";

export class LojasProdutoInvalidasError extends Error {
  constructor(mensagem: string = MENSAGEM_NENHUMA_LOJA) {
    super(mensagem);
    this.name = "LojasProdutoInvalidasError";
  }
}

const esquemaLojasProduto = z
  .array(z.string().uuid())
  .min(1, MENSAGEM_NENHUMA_LOJA);

/** Exige ao menos uma loja, todas com id válido; remove repetidas. */
export function validarLojasProduto(ids: readonly string[]): string[] {
  const r = esquemaLojasProduto.safeParse(ids);
  if (!r.success) {
    throw new LojasProdutoInvalidasError(
      ids.length === 0 ? MENSAGEM_NENHUMA_LOJA : MENSAGEM_ERRO_GENERICO,
    );
  }
  return [...new Set(r.data)];
}
