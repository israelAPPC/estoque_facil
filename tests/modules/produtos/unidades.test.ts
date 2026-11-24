import { describe, expect, it } from "vitest";
import {
  FatorInvalidoError,
  paraCaixas,
  paraUnidades,
  QuantidadeInvalidaError,
} from "@/modules/produtos/unidades";

describe("paraUnidades", () => {
  it("converte 3 caixas + 10 un com fator 24 em 82", () => {
    expect(paraUnidades(3, 10, 24)).toBe(82);
  });

  it("aceita zero caixas e zero unidades", () => {
    expect(paraUnidades(0, 0, 24)).toBe(0);
  });

  it("com fator 1 apenas soma", () => {
    expect(paraUnidades(5, 2, 1)).toBe(7);
  });

  it.each([0, -1, 1.5, Number.NaN, Number.POSITIVE_INFINITY])(
    "rejeita fator inválido %s",
    (fator) => {
      expect(() => paraUnidades(1, 1, fator)).toThrow(FatorInvalidoError);
    },
  );

  it.each([
    [-1, 0],
    [0, -1],
    [1.5, 0],
    [0, 2.5],
    [Number.NaN, 0],
    [0, Number.POSITIVE_INFINITY],
  ])("rejeita quantidade inválida (%s cx, %s un)", (cx, un) => {
    expect(() => paraUnidades(cx, un, 24)).toThrow(QuantidadeInvalidaError);
  });
});

describe("paraCaixas", () => {
  it("converte 82 com fator 24 em 3 caixas + 10 un", () => {
    expect(paraCaixas(82, 24)).toEqual({ caixas: 3, unidades: 10 });
  });

  it("zero vira 0 cx + 0 un", () => {
    expect(paraCaixas(0, 24)).toEqual({ caixas: 0, unidades: 0 });
  });

  it("com fator 1 tudo fica em caixas", () => {
    expect(paraCaixas(7, 1)).toEqual({ caixas: 7, unidades: 0 });
  });

  it("é o caminho inverso de paraUnidades", () => {
    const { caixas, unidades } = paraCaixas(paraUnidades(4, 23, 24), 24);
    expect({ caixas, unidades }).toEqual({ caixas: 4, unidades: 23 });
  });

  it.each([0, -3, 2.5, Number.NaN, Number.POSITIVE_INFINITY])(
    "rejeita fator inválido %s",
    (fator) => {
      expect(() => paraCaixas(10, fator)).toThrow(FatorInvalidoError);
    },
  );

  it.each([-1, 1.5, Number.NaN, Number.POSITIVE_INFINITY])(
    "rejeita total inválido %s",
    (total) => {
      expect(() => paraCaixas(total, 24)).toThrow(QuantidadeInvalidaError);
    },
  );
});
