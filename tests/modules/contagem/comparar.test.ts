import { describe, expect, it } from "vitest";
import {
  compararContagens,
  type ItemContado,
  ProdutoDuplicadoError,
  QuantidadeInvalidaError,
} from "@/modules/contagem/comparar";

const item = (produtoId: string, quantidade: number): ItemContado => ({
  produtoId,
  quantidade,
});

describe("compararContagens", () => {
  it("calcula o delta contra a anterior (82 vs 100 = -18)", () => {
    const r = compararContagens([item("a", 82)], [item("a", 100)]);
    expect(r).toEqual([
      {
        produtoId: "a",
        anterior: 100,
        atual: 82,
        delta: -18,
        situacao: "comparado",
      },
    ]);
  });

  it("produto novo tem anterior 0", () => {
    const r = compararContagens([item("a", 5), item("b", 7)], [item("a", 5)]);
    expect(r.find((d) => d.produtoId === "b")).toEqual({
      produtoId: "b",
      anterior: 0,
      atual: 7,
      delta: 7,
      situacao: "comparado",
    });
  });

  it("sem contagem anterior, tudo é inicial", () => {
    const r = compararContagens([item("a", 3), item("b", 0)], null);
    expect(r).toEqual([
      {
        produtoId: "a",
        anterior: null,
        atual: 3,
        delta: null,
        situacao: "inicial",
      },
      {
        produtoId: "b",
        anterior: null,
        atual: 0,
        delta: null,
        situacao: "inicial",
      },
    ]);
  });

  it("produto só na anterior fica omitido, sem delta", () => {
    const r = compararContagens([item("a", 1)], [item("a", 1), item("z", 9)]);
    expect(r.find((d) => d.produtoId === "z")).toEqual({
      produtoId: "z",
      anterior: 9,
      atual: null,
      delta: null,
      situacao: "omitido",
    });
  });

  it("não altera as entradas", () => {
    const atual = Object.freeze([Object.freeze(item("a", 1))]) as ItemContado[];
    const anterior = Object.freeze([
      Object.freeze(item("a", 2)),
      Object.freeze(item("b", 3)),
    ]) as ItemContado[];
    expect(() => compararContagens(atual, anterior)).not.toThrow();
    expect(() => compararContagens(atual, null)).not.toThrow();
    expect(atual).toEqual([{ produtoId: "a", quantidade: 1 }]);
  });

  it("não altera a anterior (comparação profunda com cópia)", () => {
    const anterior = [item("a", 2), item("b", 3)];
    const copia = structuredClone(anterior);
    const atual = [item("a", 1)];
    compararContagens(atual, anterior);
    expect(anterior).toEqual(copia);
    expect(atual).toEqual([{ produtoId: "a", quantidade: 1 }]);
  });

  it("anterior vazia (não nula) compara tudo com 0", () => {
    const r = compararContagens([item("a", 4), item("b", 0)], []);
    expect(r).toEqual([
      {
        produtoId: "a",
        anterior: 0,
        atual: 4,
        delta: 4,
        situacao: "comparado",
      },
      {
        produtoId: "b",
        anterior: 0,
        atual: 0,
        delta: 0,
        situacao: "comparado",
      },
    ]);
  });

  it("atual vazia com anterior preenchida marca tudo como omitido", () => {
    const r = compararContagens([], [item("a", 4), item("b", 6)]);
    expect(r).toEqual([
      {
        produtoId: "a",
        anterior: 4,
        atual: null,
        delta: null,
        situacao: "omitido",
      },
      {
        produtoId: "b",
        anterior: 6,
        atual: null,
        delta: null,
        situacao: "omitido",
      },
    ]);
  });

  it("ordem: comparados na ordem de atual, depois omitidos na ordem da anterior", () => {
    const r = compararContagens(
      [item("c", 1), item("a", 1)],
      [item("z", 1), item("a", 2), item("y", 3)],
    );
    expect(r.map((d) => d.produtoId)).toEqual(["c", "a", "z", "y"]);
    expect(r.map((d) => d.situacao)).toEqual([
      "comparado",
      "comparado",
      "omitido",
      "omitido",
    ]);
  });

  it("rejeita produtoId duplicado em atual", () => {
    expect(() =>
      compararContagens([item("a", 1), item("a", 2)], [item("a", 1)]),
    ).toThrow(ProdutoDuplicadoError);
    expect(() => compararContagens([item("a", 1), item("a", 2)], null)).toThrow(
      ProdutoDuplicadoError,
    );
  });

  it("rejeita produtoId duplicado em anterior", () => {
    expect(() =>
      compararContagens([item("a", 1)], [item("a", 1), item("a", 2)]),
    ).toThrow(ProdutoDuplicadoError);
  });

  it.each([-1, 1.5, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1])(
    "rejeita quantidade inválida %s em atual",
    (q) => {
      expect(() => compararContagens([item("a", q)], [])).toThrow(
        QuantidadeInvalidaError,
      );
      expect(() => compararContagens([item("a", q)], null)).toThrow(
        QuantidadeInvalidaError,
      );
    },
  );

  it("rejeita quantidade inválida em anterior", () => {
    expect(() => compararContagens([], [item("a", -2)])).toThrow(
      QuantidadeInvalidaError,
    );
  });

  it("aceita quantidade zero", () => {
    expect(() =>
      compararContagens([item("a", 0)], [item("a", 0)]),
    ).not.toThrow();
  });
});
