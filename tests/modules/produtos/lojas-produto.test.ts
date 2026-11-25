import { describe, expect, it, vi } from "vitest";
import {
  LojasProdutoInvalidasError,
  MENSAGEM_NENHUMA_LOJA,
  type Produto,
  ProdutoNaoEncontradoError,
  SkuDuplicadoError,
  validarLojasProduto,
} from "@/modules/produtos/regras";
import {
  criarProduto,
  editarProduto,
  listarProdutosPorLoja,
  obterLojasDoProduto,
  type RepositorioProdutos,
} from "@/modules/produtos/servico";

const L1 = "11111111-1111-4111-8111-111111111111";
const L2 = "22222222-2222-4222-8222-222222222222";
const L3 = "33333333-3333-4333-8333-333333333333";
const P1 = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";

const dados = { nome: "Suco", sku: "SUCO", fatorCaixa: 1, estoqueMinimo: 0 };

/**
 * Repositório em memória que imita o banco: criar/salvar são atômicos e a
 * substituição preserva vínculos de lojas desativadas, como a RPC do banco.
 */
function repoMemoria(
  opcoes: { falhar?: Error; lojasInativas?: string[] } = {},
) {
  const vinculos = new Map<string, Set<string>>();
  const produtos = new Map<string, Produto>();
  const inativas = new Set(opcoes.lojasInativas ?? []);
  const repo: RepositorioProdutos = {
    criarComLojas: vi.fn(async (d, lojas) => {
      if (opcoes.falhar) throw opcoes.falhar;
      const p = { id: P1, ativo: true, categoria: null, ...d };
      produtos.set(p.id, p);
      vinculos.set(p.id, new Set(lojas));
      return p;
    }),
    salvarComLojas: vi.fn(async (id, d, lojas) => {
      if (opcoes.falhar) throw opcoes.falhar;
      const atual = produtos.get(id);
      if (!atual) throw new ProdutoNaoEncontradoError();
      const p = { ...atual, ...d };
      produtos.set(id, p);
      if (lojas) {
        const novos = new Set<string>(lojas);
        for (const l of vinculos.get(id) ?? new Set<string>())
          if (inativas.has(l)) novos.add(l);
        vinculos.set(id, novos);
      }
      return p;
    }),
    definirAtivo: vi.fn(async () => undefined),
    listar: vi.fn(async () => ({ itens: [], total: 0 })),
    obterProduto: vi.fn(async (id) => produtos.get(id) ?? null),
    listarLojasAtivas: vi.fn(async () => [
      { id: L1, nome: L1 },
      { id: L2, nome: L2 },
      { id: L3, nome: L3 },
    ]),
    listarIdsLojasDoProduto: vi.fn(async (id) => [...(vinculos.get(id) ?? [])]),
    listarPorLoja: vi.fn(async (loja) => ({
      itens: [...vinculos]
        .filter(([, s]) => s.has(loja))
        .map(([id]) => ({ id, ativo: true, categoria: null, ...dados })),
      total: 0,
    })),
  };
  return { repo, vinculos, produtos };
}

describe("validarLojasProduto", () => {
  it("rejeita conjunto vazio com mensagem clara", () => {
    expect(() => validarLojasProduto([])).toThrow(LojasProdutoInvalidasError);
    expect(() => validarLojasProduto([])).toThrow(MENSAGEM_NENHUMA_LOJA);
  });
  it("rejeita id inválido e remove duplicados", () => {
    expect(() => validarLojasProduto(["x"])).toThrow(
      LojasProdutoInvalidasError,
    );
    expect(validarLojasProduto([L1, L1, L2])).toEqual([L1, L2]);
  });
});

describe("vínculo produto x loja", () => {
  it("criar envia produto e lojas numa só chamada", async () => {
    const { repo } = repoMemoria();
    const p = await criarProduto(repo, dados);
    expect(repo.criarComLojas).toHaveBeenCalledTimes(1);
    expect(repo.criarComLojas).toHaveBeenCalledWith(
      expect.objectContaining({ sku: "SUCO" }),
      [L1, L2, L3],
    );
    expect(await obterLojasDoProduto(repo, p.id)).toEqual([L1, L2, L3]);
  });
  it("falha da criação não deixa produto nem vínculos", async () => {
    const { repo, vinculos, produtos } = repoMemoria({
      falhar: new SkuDuplicadoError(),
    });
    await expect(criarProduto(repo, dados)).rejects.toBeInstanceOf(
      SkuDuplicadoError,
    );
    expect(produtos.size).toBe(0);
    expect(vinculos.size).toBe(0);
  });
  it("desmarcar uma loja na edição remove o vínculo", async () => {
    const { repo } = repoMemoria();
    const p = await criarProduto(repo, dados);
    await editarProduto(repo, p.id, dados, [L1, L3]);
    expect(repo.salvarComLojas).toHaveBeenCalledTimes(1);
    expect(await obterLojasDoProduto(repo, p.id)).toEqual([L1, L3]);
  });
  it("editar sem informar lojas envia null e não lê os vínculos", async () => {
    const { repo } = repoMemoria();
    const p = await criarProduto(repo, dados, [L1, L2]);
    await editarProduto(repo, p.id, { ...dados, nome: "Novo" });
    expect(repo.salvarComLojas).toHaveBeenCalledWith(
      p.id,
      expect.objectContaining({ nome: "Novo" }),
      null,
    );
    expect(repo.listarIdsLojasDoProduto).not.toHaveBeenCalled();
    expect(await obterLojasDoProduto(repo, p.id)).toEqual([L1, L2]);
  });
  it("regressão: editar não altera o ativo de produto desativado", async () => {
    const { repo, produtos } = repoMemoria();
    const p = await criarProduto(repo, dados, [L1]);
    produtos.set(p.id, { ...p, ativo: false });
    const r = await editarProduto(repo, p.id, { ...dados, nome: "Novo" });
    expect(r.ativo).toBe(false);
  });
  it("falha da edição mantém produto e vínculos como estavam", async () => {
    const { repo, produtos, vinculos } = repoMemoria();
    const p = await criarProduto(repo, dados, [L1, L2]);
    vi.mocked(repo.salvarComLojas).mockRejectedValueOnce(
      new SkuDuplicadoError(),
    );
    await expect(
      editarProduto(repo, p.id, { ...dados, nome: "Outro" }, [L3]),
    ).rejects.toBeInstanceOf(SkuDuplicadoError);
    expect(produtos.get(p.id)?.nome).toBe("Suco");
    expect([...(vinculos.get(p.id) ?? [])]).toEqual([L1, L2]);
  });
  it("produto inexistente na edição vira ProdutoNaoEncontradoError", async () => {
    const { repo } = repoMemoria();
    await expect(editarProduto(repo, P1, dados, [L1])).rejects.toBeInstanceOf(
      ProdutoNaoEncontradoError,
    );
  });
  it("regressão: editar só o nome não apaga vínculo de loja desativada", async () => {
    const { repo, vinculos } = repoMemoria({ lojasInativas: [L3] });
    const p = await criarProduto(repo, dados, [L1, L3]);
    // o formulário só mostra lojas ativas: L3 não vem marcada
    await editarProduto(repo, p.id, { ...dados, nome: "Suco Novo" }, [L1]);
    expect(vinculos.get(p.id)?.has(L3)).toBe(true);
  });
  it("conjunto vazio é rejeitado sem gravar nada", async () => {
    const { repo } = repoMemoria();
    await expect(criarProduto(repo, dados, [])).rejects.toBeInstanceOf(
      LojasProdutoInvalidasError,
    );
    expect(repo.criarComLojas).not.toHaveBeenCalled();
    await expect(editarProduto(repo, P1, dados, [])).rejects.toBeInstanceOf(
      LojasProdutoInvalidasError,
    );
    expect(repo.salvarComLojas).not.toHaveBeenCalled();
  });
  it("listagem por loja devolve só os vinculados àquela loja", async () => {
    const { repo } = repoMemoria();
    await criarProduto(repo, dados, [L1]);
    const r2 = await listarProdutosPorLoja(repo, L2, { pagina: 1 });
    const r1 = await listarProdutosPorLoja(repo, L1, { pagina: 1 });
    expect(r2.itens).toHaveLength(0);
    expect(r1.itens).toHaveLength(1);
  });
  it("listagem por loja rejeita id inválido e normaliza a página", async () => {
    const { repo } = repoMemoria();
    await expect(
      listarProdutosPorLoja(repo, "x", { pagina: 1 }),
    ).rejects.toBeInstanceOf(LojasProdutoInvalidasError);
    await listarProdutosPorLoja(repo, L1, { pagina: -2 });
    expect(repo.listarPorLoja).toHaveBeenCalledWith(L1, {
      deslocamento: 0,
      limite: 20,
    });
  });
});
