import { describe, expect, it } from "vitest";
import {
  calcularSaldo,
  DataInvalidaError,
  QuantidadeInvalidaError,
} from "@/modules/estoque/saldo";

const base = { data: "2026-11-10T10:00:00Z", quantidade: 100 };

describe("calcularSaldo", () => {
  it("com base, soma só movimentos posteriores", () => {
    const saldo = calcularSaldo(base, [
      { data: "2026-11-11T08:00:00Z", delta: -18 },
      { data: "2026-11-12T08:00:00Z", delta: 5 },
    ]);
    expect(saldo).toBe(87);
  });

  it("ignora movimento retroativo", () => {
    expect(
      calcularSaldo(base, [{ data: "2026-11-09T23:59:59Z", delta: -50 }]),
    ).toBe(100);
  });

  it("instante igual ao da base não entra", () => {
    expect(
      calcularSaldo(base, [{ data: "2026-11-10T10:00:00Z", delta: -10 }]),
    ).toBe(100);
  });

  it("compara por instante, não por string (fusos diferentes)", () => {
    // 07:00-03:00 == 10:00Z: igual, não entra
    expect(
      calcularSaldo(base, [{ data: "2026-11-10T07:00:00-03:00", delta: -10 }]),
    ).toBe(100);
    // 08:00-03:00 == 11:00Z: posterior, entra
    expect(
      calcularSaldo(base, [{ data: "2026-11-10T08:00:00-03:00", delta: -10 }]),
    ).toBe(90);
  });

  it("mesmo dia com hora posterior entra", () => {
    expect(
      calcularSaldo(base, [{ data: "2026-11-10T10:00:01Z", delta: -1 }]),
    ).toBe(99);
  });

  it("sem base soma todos os movimentos", () => {
    expect(
      calcularSaldo(null, [
        { data: "2026-01-01T00:00:00Z", delta: 10 },
        { data: "2026-02-01T00:00:00Z", delta: -3 },
      ]),
    ).toBe(7);
  });

  it("sem base e sem movimentos devolve 0", () => {
    expect(calcularSaldo(null, [])).toBe(0);
  });

  it("devolve saldo negativo sem erro", () => {
    expect(
      calcularSaldo({ data: base.data, quantidade: 3 }, [
        { data: "2026-11-11T00:00:00Z", delta: -5 },
      ]),
    ).toBe(-2);
  });

  it("não muta as entradas", () => {
    const b = { ...base };
    const movs = [{ data: "2026-11-11T08:00:00Z", delta: -1 }];
    const copiaB = structuredClone(b);
    const copiaM = structuredClone(movs);
    calcularSaldo(b, movs);
    expect(b).toEqual(copiaB);
    expect(movs).toEqual(copiaM);
  });

  it.each([
    "",
    "ontem",
    "2026-11-10",
    "2026-13-40T00:00:00Z",
    "2026-11-10T10:00:00",
  ])("rejeita data inválida de movimento %j", (data) => {
    expect(() => calcularSaldo(base, [{ data, delta: 1 }])).toThrow(
      DataInvalidaError,
    );
  });

  it("rejeita data inválida da base", () => {
    expect(() => calcularSaldo({ data: "x", quantidade: 1 }, [])).toThrow(
      DataInvalidaError,
    );
  });

  it("rejeita data inválida mesmo sem base", () => {
    expect(() => calcularSaldo(null, [{ data: "x", delta: 1 }])).toThrow(
      DataInvalidaError,
    );
  });

  it("rejeita dia inexistente no calendário", () => {
    expect(() =>
      calcularSaldo(base, [{ data: "2026-02-30T00:00:00Z", delta: 1 }]),
    ).toThrow(DataInvalidaError);
  });

  it.each([Number.NaN, Number.POSITIVE_INFINITY, 1.5, -1, 2 ** 53])(
    "rejeita quantidade da base inválida %j",
    (quantidade) => {
      expect(() => calcularSaldo({ data: base.data, quantidade }, [])).toThrow(
        QuantidadeInvalidaError,
      );
    },
  );

  it.each([
    Number.NaN,
    Number.POSITIVE_INFINITY,
    Number.NEGATIVE_INFINITY,
    1.5,
    2 ** 53,
  ])("rejeita delta inválido %j", (delta) => {
    expect(() =>
      calcularSaldo(base, [{ data: "2026-11-11T00:00:00Z", delta }]),
    ).toThrow(QuantidadeInvalidaError);
  });

  it("rejeita delta inválido mesmo em movimento retroativo e sem base", () => {
    expect(() =>
      calcularSaldo(base, [{ data: "2026-11-01T00:00:00Z", delta: 1.5 }]),
    ).toThrow(QuantidadeInvalidaError);
    expect(() =>
      calcularSaldo(null, [
        { data: "2026-11-01T00:00:00Z", delta: Number.NaN },
      ]),
    ).toThrow(QuantidadeInvalidaError);
  });

  it("aceita delta negativo e base zero", () => {
    expect(
      calcularSaldo({ data: base.data, quantidade: 0 }, [
        { data: "2026-11-11T00:00:00Z", delta: -4 },
      ]),
    ).toBe(-4);
  });
});
