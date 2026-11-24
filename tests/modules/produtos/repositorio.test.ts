import type { SupabaseClient } from "@supabase/supabase-js";
import { describe, expect, it, vi } from "vitest";
import {
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

/** Cliente falso: toda cadeia de consulta termina devolvendo `resposta`. */
function clienteFalso(resposta: {
  data?: unknown;
  error?: { code?: string } | null;
}) {
  const final = vi.fn(async () => ({ data: null, error: null, ...resposta }));
  const cadeia: Record<string, unknown> = {};
  for (const m of ["insert", "update", "select", "eq", "order", "range"]) {
    cadeia[m] = vi.fn(() => cadeia);
  }
  cadeia.single = final;
  cadeia.maybeSingle = final;
  return { from: vi.fn(() => cadeia) } as unknown as SupabaseClient;
}

describe("criarRepositorioProdutos", () => {
  it("converte o código 23505 do banco em SkuDuplicadoError", async () => {
    const repo = criarRepositorioProdutos(
      clienteFalso({ error: { code: "23505" } }),
    );
    await expect(repo.inserir(dados)).rejects.toBeInstanceOf(SkuDuplicadoError);
  });

  it("converte outros erros em erro genérico sem vazar detalhe", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    const repo = criarRepositorioProdutos(
      clienteFalso({ error: { code: "XX000" } }),
    );
    await expect(repo.atualizar("1", dados)).rejects.toBeInstanceOf(
      ProdutoErroDesconhecidoError,
    );
  });

  it("atualizar id inexistente (PGRST116) vira ProdutoNaoEncontradoError", async () => {
    const repo = criarRepositorioProdutos(
      clienteFalso({ error: { code: "PGRST116" } }),
    );
    const erro = await repo.atualizar("1", dados).catch((e) => e);
    expect(erro).toBeInstanceOf(ProdutoNaoEncontradoError);
    expect(erro.message).toBe("Produto não encontrado.");
  });

  it("obterProduto devolve null quando não existe", async () => {
    const repo = criarRepositorioProdutos(clienteFalso({ data: null }));
    expect(await repo.obterProduto("1")).toBeNull();
  });
});
