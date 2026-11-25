import { describe, expect, it, vi } from "vitest";
import {
  EntradaProdutoInvalidaError,
  SkuDuplicadoError,
} from "@/modules/produtos/regras";
import {
  alterarAtivo,
  criarProduto,
  editarProduto,
  listarProdutos,
  obterProduto,
  type RepositorioProdutos,
} from "@/modules/produtos/servico";

function repo(sobrescrever: Partial<RepositorioProdutos> = {}) {
  const base: RepositorioProdutos = {
    criarComLojas: vi.fn(async (d) => ({ id: "1", ativo: true, ...d })),
    salvarComLojas: vi.fn(async (id, d) => ({ id, ativo: true, ...d })),
    definirAtivo: vi.fn(async () => undefined),
    listar: vi.fn(async () => ({ itens: [], total: 0 })),
    obterProduto: vi.fn(async () => null),
    listarLojasAtivas: vi.fn(async () => [
      {
        id: "11111111-1111-4111-8111-111111111111",
        nome: "11111111-1111-4111-8111-111111111111",
      },
    ]),
    listarIdsLojasDoProduto: vi.fn(async () => [
      "11111111-1111-4111-8111-111111111111",
    ]),
    listarPorLoja: vi.fn(async () => ({ itens: [], total: 0 })),
  };
  return { ...base, ...sobrescrever };
}

const valido = {
  nome: "Refrigerante 2L",
  sku: " ref-2l ",
  categoria: "Bebidas",
  fatorCaixa: 6,
  estoqueMinimo: 12,
};

describe("criarProduto", () => {
  it("cria produto válido com SKU normalizado (trim)", async () => {
    const r = repo();
    const p = await criarProduto(r, valido);
    expect(p.sku).toBe("ref-2l");
    expect(r.criarComLojas).toHaveBeenCalledWith(
      expect.objectContaining({ fatorCaixa: 6, estoqueMinimo: 12 }),
      expect.any(Array),
    );
  });
  it("sem caixa informada usa fator 1", async () => {
    const r = repo();
    await criarProduto(r, { ...valido, fatorCaixa: undefined });
    expect(r.criarComLojas).toHaveBeenCalledWith(
      expect.objectContaining({ fatorCaixa: 1 }),
      expect.any(Array),
    );
  });
  it.each([0, -3, 2.5])("fator %s é rejeitado", async (fator) => {
    await expect(
      criarProduto(repo(), { ...valido, fatorCaixa: fator }),
    ).rejects.toBeInstanceOf(EntradaProdutoInvalidaError);
  });
  it("estoque mínimo negativo ou fracionado é rejeitado", async () => {
    for (const minimo of [-1, 1.5]) {
      await expect(
        criarProduto(repo(), { ...valido, estoqueMinimo: minimo }),
      ).rejects.toBeInstanceOf(EntradaProdutoInvalidaError);
    }
  });
  it("estoque mínimo 0 é aceito", async () => {
    await expect(
      criarProduto(repo(), { ...valido, estoqueMinimo: 0 }),
    ).resolves.toBeDefined();
  });
  it("nome e SKU vazios são rejeitados", async () => {
    await expect(
      criarProduto(repo(), { ...valido, nome: "  " }),
    ).rejects.toBeInstanceOf(EntradaProdutoInvalidaError);
    await expect(
      criarProduto(repo(), { ...valido, sku: "" }),
    ).rejects.toBeInstanceOf(EntradaProdutoInvalidaError);
  });
  it("SKU duplicado vira erro tipado com mensagem amigável", async () => {
    const r = repo({
      criarComLojas: vi.fn(async () => {
        throw new SkuDuplicadoError();
      }),
    });
    const erro = await criarProduto(r, valido).catch((e) => e);
    expect(erro).toBeInstanceOf(SkuDuplicadoError);
    expect(erro.message).toBe("Já existe um produto com este código (SKU).");
  });
});

const ID = "123e4567-e89b-12d3-a456-426614174000";

describe("editarProduto", () => {
  it("valida e atualiza", async () => {
    const r = repo();
    const p = await editarProduto(r, ID, valido);
    expect(p.id).toBe(ID);
    await expect(
      editarProduto(r, ID, { ...valido, fatorCaixa: 0 }),
    ).rejects.toBeInstanceOf(EntradaProdutoInvalidaError);
  });
  it("rejeita id que não é uuid sem chamar o repositório", async () => {
    const r = repo();
    await expect(editarProduto(r, "9", valido)).rejects.toBeInstanceOf(
      EntradaProdutoInvalidaError,
    );
    expect(r.salvarComLojas).not.toHaveBeenCalled();
  });
});

describe("alterarAtivo", () => {
  it("desativa sem excluir", async () => {
    const r = repo();
    await alterarAtivo(r, ID, false);
    expect(r.definirAtivo).toHaveBeenCalledWith(ID, false);
  });
  it("rejeita id inválido ou ativo não booleano", async () => {
    const r = repo();
    await expect(alterarAtivo(r, "9", false)).rejects.toBeInstanceOf(
      EntradaProdutoInvalidaError,
    );
    await expect(
      alterarAtivo(r, ID, "false" as unknown as boolean),
    ).rejects.toBeInstanceOf(EntradaProdutoInvalidaError);
    expect(r.definirAtivo).not.toHaveBeenCalled();
  });
});

describe("listarProdutos", () => {
  it("pagina com limite máximo e página mínima", async () => {
    const r = repo();
    await listarProdutos(r, { pagina: -2, tamanho: 9999 });
    expect(r.listar).toHaveBeenCalledWith({ deslocamento: 0, limite: 100 });
    await listarProdutos(r, { pagina: 3, tamanho: 20 });
    expect(r.listar).toHaveBeenLastCalledWith({ deslocamento: 40, limite: 20 });
  });
  it("devolve total de páginas", async () => {
    const r = repo({ listar: vi.fn(async () => ({ itens: [], total: 45 })) });
    const res = await listarProdutos(r, { pagina: 1, tamanho: 20 });
    expect(res.totalPaginas).toBe(3);
  });
});

describe("obterProduto", () => {
  it("devolve o produto do repositório", async () => {
    const produto = { id: "1", ativo: true, ...valido, sku: "ref-2l" };
    const r = repo({ obterProduto: vi.fn(async () => produto) });
    expect(await obterProduto(r, "1")).toEqual(produto);
  });
});
