/** Converte o parâmetro ?pagina= da URL em número de página válido (mínimo 1). */
export function interpretarPagina(
  valor: string | string[] | undefined,
): number {
  if (typeof valor !== "string" || !/^\d+$/.test(valor)) return 1;
  const numero = Number(valor);
  return Number.isSafeInteger(numero) && numero >= 1 ? numero : 1;
}
