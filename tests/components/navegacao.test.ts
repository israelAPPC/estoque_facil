import { describe, expect, it } from "vitest";
import {
  buscarGrupo,
  GRUPOS_MENU,
  ITENS_BARRA,
  ITENS_MAIS,
  ITENS_MENU,
  itemAtivo,
  maisAtivo,
  TITULO_MAIS,
} from "@/components/navegacao";

describe("grupos do menu", () => {
  it("tem os grupos Estoque e Cadastro na ordem", () => {
    expect(GRUPOS_MENU.map((g) => g.titulo)).toEqual(["Estoque", "Cadastro"]);
  });

  it("o grupo Estoque tem quatro itens na ordem", () => {
    expect(GRUPOS_MENU[0]?.itens.map((i) => i.rotulo)).toEqual([
      "Estoque",
      "Contagens",
      "Requisições",
      "Histórico",
    ]);
  });

  it("o grupo Cadastro tem Produtos e Lojas", () => {
    expect(GRUPOS_MENU[1]?.itens.map((i) => i.rotulo)).toEqual([
      "Produtos",
      "Lojas",
    ]);
  });

  it("a lista plana segue a ordem dos grupos", () => {
    expect(ITENS_MENU.map((i) => i.rotulo)).toEqual([
      "Estoque",
      "Contagens",
      "Requisições",
      "Histórico",
      "Produtos",
      "Lojas",
    ]);
  });
});

describe("buscarGrupo", () => {
  it("devolve o grupo pelo título", () => {
    expect(buscarGrupo(GRUPOS_MENU, "Cadastro").titulo).toBe("Cadastro");
  });

  it("lança erro se o grupo não existe", () => {
    expect(() => buscarGrupo(GRUPOS_MENU, "Inexistente")).toThrow(
      /Inexistente/,
    );
  });
});

describe("itemAtivo", () => {
  it("marca o item cuja rota é igual ao caminho", () => {
    expect(itemAtivo("/lojas")).toBe("/lojas");
  });

  it("marca o item para subrotas", () => {
    expect(itemAtivo("/produtos/novo")).toBe("/produtos");
  });

  it("não confunde prefixos parecidos", () => {
    expect(itemAtivo("/lojasx")).toBeNull();
  });

  it("a raiz marca Estoque", () => {
    expect(itemAtivo("/")).toBe("/estoque");
  });

  it("rota desconhecida não marca nada", () => {
    expect(itemAtivo("/login")).toBeNull();
  });
});

describe("barra inferior (celular)", () => {
  it("tem os quatro itens do grupo Estoque", () => {
    expect(ITENS_BARRA.map((i) => i.rotulo)).toEqual([
      "Estoque",
      "Contagens",
      "Requisições",
      "Histórico",
    ]);
  });

  it("o Mais mostra o título Cadastro", () => {
    expect(TITULO_MAIS).toBe("Cadastro");
  });

  it("o Mais abre Produtos e Lojas", () => {
    expect(ITENS_MAIS.map((i) => i.rotulo)).toEqual(["Produtos", "Lojas"]);
  });

  it("Mais fica ativo em Lojas e Produtos, inclusive subrotas", () => {
    expect(maisAtivo("/lojas")).toBe(true);
    expect(maisAtivo("/produtos/novo")).toBe(true);
  });

  it("Mais não fica ativo nos itens principais", () => {
    expect(maisAtivo("/estoque")).toBe(false);
    expect(maisAtivo("/")).toBe(false);
  });
});
