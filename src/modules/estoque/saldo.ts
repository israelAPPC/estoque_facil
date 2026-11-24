import { z } from "zod";

export class DataInvalidaError extends Error {
  constructor(public readonly valor: string) {
    super(`Data inválida: "${valor}". Use o formato ISO 8601 com hora e fuso.`);
    this.name = "DataInvalidaError";
  }
}

export class QuantidadeInvalidaError extends Error {
  constructor(
    public readonly campo: "base" | "delta",
    public readonly valor: number,
  ) {
    super(
      campo === "base"
        ? `Quantidade da contagem inválida: ${valor}. Use um inteiro maior ou igual a 0.`
        : `Movimento inválido: ${valor}. Use um número inteiro.`,
    );
    this.name = "QuantidadeInvalidaError";
  }
}

export type ContagemBase = { data: string; quantidade: number };
export type Movimento = { data: string; delta: number };

const dataIso = z.iso.datetime({ offset: true });

function validarBase(quantidade: number): void {
  if (!Number.isSafeInteger(quantidade) || quantidade < 0) {
    throw new QuantidadeInvalidaError("base", quantidade);
  }
}

function validarDelta(delta: number): void {
  if (!Number.isSafeInteger(delta)) {
    throw new QuantidadeInvalidaError("delta", delta);
  }
}

// Date.parse trunca para milissegundos: instantes que diferem só em
// frações menores (ex.: .0001Z) são tratados como iguais.
function instante(data: string): number {
  if (!dataIso.safeParse(data).success) throw new DataInvalidaError(data);
  const ms = Date.parse(data);
  if (Number.isNaN(ms)) throw new DataInvalidaError(data);
  return ms;
}

/**
 * Saldo = contagem-base + movimentos com instante estritamente posterior ao da base.
 * Quantidades na menor unidade. Saldo negativo é devolvido sem erro.
 * Base deve ser inteiro seguro >= 0 e delta inteiro seguro (pode ser negativo);
 * caso contrário lança QuantidadeInvalidaError. Valida todos os movimentos,
 * inclusive os anteriores à base.
 */
export function calcularSaldo(
  base: ContagemBase | null,
  movimentos: Movimento[],
): number {
  if (base) validarBase(base.quantidade);
  const instanteBase = base ? instante(base.data) : Number.NEGATIVE_INFINITY;
  let saldo = base ? base.quantidade : 0;
  for (const movimento of movimentos) {
    validarDelta(movimento.delta);
    if (instante(movimento.data) > instanteBase) saldo += movimento.delta;
  }
  return saldo;
}
