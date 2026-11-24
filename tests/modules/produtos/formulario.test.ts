import { describe, expect, it } from "vitest";
import {
  descreverEstoqueMinimo,
  lerFormularioProduto,
} from "@/modules/produtos/formulario";

function dados(campos: Record<string, string>) {
  const fd = new FormData();
  for (const [k, v] of Object.entries(campos)) fd.set(k, v);
  return fd;
}

describe("lerFormularioProduto", () => {
  it("converte caixas e unidades do mínimo para a menor unidade", () => {
    const r = lerFormularioProduto(
      dados({
        nome: "Água",
        sku: "A1",
        fatorCaixa: "24",
        minimoCaixas: "3",
        minimoUnidades: "10",
      }),
    );
    expect(r.erros).toEqual({});
    expect(r.dados?.estoqueMinimo).toBe(82);
    expect(r.dados?.fatorCaixa).toBe(24);
  });

  it("campos vazios de quantidade valem 0 e fator vazio vale 1", () => {
    const r = lerFormularioProduto(dados({ nome: "X", sku: "x" }));
    expect(r.dados?.estoqueMinimo).toBe(0);
    expect(r.dados?.fatorCaixa).toBe(1);
  });

  it("rejeita fator zero com mensagem no campo", () => {
    const r = lerFormularioProduto(
      dados({ nome: "X", sku: "x", fatorCaixa: "0" }),
    );
    expect(r.dados).toBeNull();
    expect(r.erros.fatorCaixa).toBeDefined();
  });

  it("rejeita mínimo não inteiro ou negativo", () => {
    const a = lerFormularioProduto(
      dados({ nome: "X", sku: "x", minimoUnidades: "1.5" }),
    );
    const b = lerFormularioProduto(
      dados({ nome: "X", sku: "x", minimoCaixas: "-1" }),
    );
    expect(a.erros.minimoUnidades).toBeDefined();
    expect(b.erros.minimoCaixas).toBeDefined();
  });

  it("exige nome e SKU", () => {
    const r = lerFormularioProduto(dados({ nome: " ", sku: "" }));
    expect(r.erros.nome).toBeDefined();
    expect(r.erros.sku).toBeDefined();
  });
});

describe("descreverEstoqueMinimo", () => {
  it("mostra caixas e unidades quando há caixa", () => {
    expect(descreverEstoqueMinimo(82, 24)).toBe("3 cx + 10 un");
  });
  it("mostra só unidades quando fator é 1", () => {
    expect(descreverEstoqueMinimo(5, 1)).toBe("5 un");
  });
});
