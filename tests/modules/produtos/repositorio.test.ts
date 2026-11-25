import type { SupabaseClient } from "@supabase/supabase-js";
import { describe, expect, it, vi } from "vitest";
import {
  LojasProdutoInvalidasError,
  ProdutoErroDesconhecidoError,
  ProdutoNaoEncontradoError,
  SkuDuplicadoError,
} from "@/modules/produtos/regras";
import { criarRepositorioProdutos } from "@/modules/produtos/repositorio";

const dados = {
  nome: "Refrigerante 2L",
  sku: "REF-2L",
  categoria: null,
  fatorCaixa: 6,
  estoqueMinimo: 12,
};

const LOJA = "11111111-1111-4111-8111-111111111111";
const ID = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";

type Resposta = {
  data?: unknown;
  error?: { code?: string; message?: string; hint?: string } | null;
};

/** Cliente falso: `rpc` devolve `resposta`; `from` falha (não deve ser usado). */
function clienteRpc(resposta: Resposta) {
  const rpc = vi.fn(async () => ({ data: null, error: null, ...resposta }));
  const from = vi.fn(() => {
    throw new Error("não deveria usar from");
  });
  return { rpc, from, db: { rpc, from } as unknown as SupabaseClient };
}

/** Cliente falso para `from(...)`: toda cadeia termina devolvendo `resposta`. */
function clienteFrom(resposta: Resposta, rpc = vi.fn()) {
  const final = vi.fn(async () => ({ data: null, error: null, ...resposta }));
  const cadeia: Record<string, unknown> = {};
  for (const m of ["insert", "update", "select", "eq", "order", "range"]) {
    cadeia[m] = vi.fn(() => cadeia);
  }
  cadeia.single = final;
  cadeia.maybeSingle = final;
  return {
    rpc,
    db: { rpc, from: vi.fn(() => cadeia) } as unknown as SupabaseClient,
  };
}

describe("criarRepositorioProdutos", () => {
  it("criarComLojas faz uma só chamada RPC com todos os campos explícitos", async () => {
    const c = clienteRpc({ data: ID });
    const p = await criarRepositorioProdutos(c.db).criarComLojas(dados, [LOJA]);
    expect(c.rpc).toHaveBeenCalledTimes(1);
    expect(c.rpc).toHaveBeenCalledWith("criar_produto_com_lojas", {
      p_sku: "REF-2L",
      p_nome: "Refrigerante 2L",
      p_categoria: null,
      p_fator_caixa: 6,
      p_estoque_minimo_unidades: 12,
      p_ativo: true,
      p_loja_ids: [LOJA],
    });
    expect(c.from).not.toHaveBeenCalled();
    expect(p).toMatchObject({ id: ID, ativo: true, sku: "REF-2L" });
  });

  const linha = {
    id: ID,
    sku: "REF-2L",
    nome: "Refrigerante 2L",
    categoria: null,
    fator_caixa: 6,
    estoque_minimo_unidades: 12,
    ativo: false,
  };

  it("salvarComLojas não envia ativo, não lê antes e usa a linha devolvida", async () => {
    const c = clienteRpc({ data: linha });
    const p = await criarRepositorioProdutos(c.db).salvarComLojas(ID, dados, [
      LOJA,
    ]);
    expect(c.rpc).toHaveBeenCalledTimes(1);
    expect(c.from).not.toHaveBeenCalled();
    expect(c.rpc).toHaveBeenCalledWith("salvar_produto_com_lojas", {
      p_produto_id: ID,
      p_sku: "REF-2L",
      p_nome: "Refrigerante 2L",
      p_categoria: null,
      p_fator_caixa: 6,
      p_estoque_minimo_unidades: 12,
      p_loja_ids: [LOJA],
    });
    expect(p).toMatchObject({ id: ID, ativo: false, fatorCaixa: 6 });
  });

  it("salvarComLojas com lojas nulas envia p_loja_ids nulo", async () => {
    const c = clienteRpc({ data: linha });
    await criarRepositorioProdutos(c.db).salvarComLojas(ID, dados, null);
    expect(c.rpc).toHaveBeenCalledWith(
      "salvar_produto_com_lojas",
      expect.objectContaining({ p_loja_ids: null }),
    );
  });

  it("salvarComLojas com P0002 vira ProdutoNaoEncontradoError", async () => {
    const c = clienteRpc({ error: { code: "P0002" } });
    await expect(
      criarRepositorioProdutos(c.db).salvarComLojas(ID, dados, [LOJA]),
    ).rejects.toBeInstanceOf(ProdutoNaoEncontradoError);
  });

  it("22023 com hint lojas_invalidas vira LojasProdutoInvalidasError", async () => {
    const repo = criarRepositorioProdutos(
      clienteRpc({ error: { code: "22023", hint: "lojas_invalidas" } }).db,
    );
    const erro = await repo.criarComLojas(dados, [LOJA]).catch((e) => e);
    expect(erro).toBeInstanceOf(LojasProdutoInvalidasError);
    expect(erro.message).toBe(
      "Uma ou mais lojas selecionadas não estão disponíveis. Recarregue a página.",
    );
  });

  it("22023 sem o hint (lista vazia) pede ao menos uma loja", async () => {
    const repo = criarRepositorioProdutos(
      clienteRpc({ error: { code: "22023" } }).db,
    );
    const erro = await repo.criarComLojas(dados, [LOJA]).catch((e) => e);
    expect(erro).toBeInstanceOf(LojasProdutoInvalidasError);
    expect(erro.message).toBe("Marque ao menos uma loja para o produto.");
  });

  it("23505 vira SkuDuplicadoError", async () => {
    const repo = criarRepositorioProdutos(
      clienteRpc({ error: { code: "23505" } }).db,
    );
    await expect(repo.criarComLojas(dados, [LOJA])).rejects.toBeInstanceOf(
      SkuDuplicadoError,
    );
  });

  it("P0002 da RPC vira ProdutoNaoEncontradoError", async () => {
    const repo = criarRepositorioProdutos(
      clienteRpc({ error: { code: "P0002" } }).db,
    );
    const erro = await repo.criarComLojas(dados, [LOJA]).catch((e) => e);
    expect(erro).toBeInstanceOf(ProdutoNaoEncontradoError);
    expect(erro.message).toBe("Produto não encontrado.");
  });

  it.each(["23514", "23503", "23502", "XX000"])(
    "código %s vira erro genérico sem vazar detalhe",
    async (code) => {
      const log = vi
        .spyOn(console, "error")
        .mockImplementation(() => undefined);
      const repo = criarRepositorioProdutos(
        clienteRpc({ error: { code, message: "segredo interno" } }).db,
      );
      const erro = await repo.criarComLojas(dados, [LOJA]).catch((e) => e);
      expect(erro).toBeInstanceOf(ProdutoErroDesconhecidoError);
      expect(erro.message).not.toContain("segredo");
      expect(JSON.stringify(log.mock.calls)).not.toContain("segredo");
      log.mockRestore();
    },
  );

  it("obterProduto devolve null quando não existe", async () => {
    const repo = criarRepositorioProdutos(clienteFrom({ data: null }).db);
    expect(await repo.obterProduto("1")).toBeNull();
  });
});
