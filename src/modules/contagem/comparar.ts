import { QuantidadeInvalidaError } from "@/modules/produtos/unidades";

export { QuantidadeInvalidaError };

/** Item de uma contagem; quantidade sempre na menor unidade. */
export type ItemContado = {
  produtoId: string;
  quantidade: number;
};

export type SituacaoDiferenca = "inicial" | "comparado" | "omitido";

export type Diferenca = {
  produtoId: string;
  anterior: number | null;
  atual: number | null;
  delta: number | null;
  situacao: SituacaoDiferenca;
};

export class ProdutoDuplicadoError extends Error {
  constructor(public readonly produtoId: string) {
    super("O mesmo produto aparece mais de uma vez na contagem.");
    this.name = "ProdutoDuplicadoError";
  }
}

function validarItens(itens: readonly ItemContado[]): void {
  const vistos = new Set<string>();
  for (const { produtoId, quantidade } of itens) {
    if (!Number.isSafeInteger(quantidade) || quantidade < 0) {
      throw new QuantidadeInvalidaError(quantidade);
    }
    if (vistos.has(produtoId)) throw new ProdutoDuplicadoError(produtoId);
    vistos.add(produtoId);
  }
}

/**
 * Compara a contagem atual com a anterior da mesma loja. Função pura.
 * - produtoId duplicado: ProdutoDuplicadoError; quantidade inválida: QuantidadeInvalidaError.
 * - anterior null: tudo "inicial", sem delta.
 * - produto novo: anterior 0.
 * - produto só na anterior: "omitido", sem atual nem delta (manter/zerar é decidido na confirmação).
 */
export function compararContagens(
  atual: readonly ItemContado[],
  anterior: readonly ItemContado[] | null,
): Diferenca[] {
  validarItens(atual);
  if (anterior !== null) validarItens(anterior);

  if (anterior === null) {
    return atual.map((i) => ({
      produtoId: i.produtoId,
      anterior: null,
      atual: i.quantidade,
      delta: null,
      situacao: "inicial",
    }));
  }

  const anteriorPorProduto = new Map(
    anterior.map((i) => [i.produtoId, i.quantidade]),
  );
  const idsAtuais = new Set(atual.map((i) => i.produtoId));

  const comparados: Diferenca[] = atual.map((i) => {
    const antes = anteriorPorProduto.get(i.produtoId) ?? 0;
    return {
      produtoId: i.produtoId,
      anterior: antes,
      atual: i.quantidade,
      delta: i.quantidade - antes,
      situacao: "comparado",
    };
  });

  const omitidos: Diferenca[] = anterior
    .filter((i) => !idsAtuais.has(i.produtoId))
    .map((i) => ({
      produtoId: i.produtoId,
      anterior: i.quantidade,
      atual: null,
      delta: null,
      situacao: "omitido",
    }));

  return [...comparados, ...omitidos];
}
