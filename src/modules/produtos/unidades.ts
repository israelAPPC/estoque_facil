export class FatorInvalidoError extends Error {
  constructor(public readonly fator: number) {
    super("O fator caixa→unidade deve ser um número inteiro maior que 0.");
    this.name = "FatorInvalidoError";
  }
}

export class QuantidadeInvalidaError extends Error {
  constructor(public readonly quantidade: number) {
    super("A quantidade deve ser um número inteiro maior ou igual a 0.");
    this.name = "QuantidadeInvalidaError";
  }
}

function validarFator(fator: number): void {
  if (!Number.isInteger(fator) || fator <= 0) {
    throw new FatorInvalidoError(fator);
  }
}

function validarQuantidade(quantidade: number): void {
  if (!Number.isInteger(quantidade) || quantidade < 0) {
    throw new QuantidadeInvalidaError(quantidade);
  }
}

/** Converte caixas + unidades para a menor unidade (o que é gravado). */
export function paraUnidades(
  caixas: number,
  unidades: number,
  fator: number,
): number {
  validarFator(fator);
  validarQuantidade(caixas);
  validarQuantidade(unidades);
  return caixas * fator + unidades;
}

/** Converte o total na menor unidade para caixas + unidades (só exibição). */
export function paraCaixas(
  total: number,
  fator: number,
): { caixas: number; unidades: number } {
  validarFator(fator);
  validarQuantidade(total);
  return { caixas: Math.floor(total / fator), unidades: total % fator };
}
