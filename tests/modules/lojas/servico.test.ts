import { describe, expect, it } from "vitest";
import {
  criarLoja,
  definirAtivoLoja,
  editarLoja,
  listarLojas,
  MENSAGEM_ERRO_GENERICO,
  MENSAGEM_NOME_DUPLICADO,
  MENSAGEM_NOME_OBRIGATORIO,
  obterLoja,
  TAMANHO_PAGINA_PADRAO,
} from "@/modules/lojas/servico";
import {
  type Loja,
  LojaErroDesconhecidoError,
  NomeDuplicadoError,
  type RepositorioLojas,
} from "@/modules/lojas/tipos";

const idDe = (n: number) =>
  `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const ID1 = idDe(1);

function repositorioFalso(): RepositorioLojas & { lojas: Loja[] } {
  const lojas: Loja[] = [];
  const existe = (nome: string, ignorar?: string) =>
    lojas.some(
      (l) =>
        l.id !== ignorar &&
        l.nome.trim().toLowerCase() === nome.trim().toLowerCase(),
    );
  return {
    lojas,
    async listar({ pagina, tamanho }) {
      const inicio = (pagina - 1) * tamanho;
      return {
        itens: lojas.slice(inicio, inicio + tamanho),
        total: lojas.length,
      };
    },
    async inserir(nome) {
      if (existe(nome)) throw new NomeDuplicadoError();
      const loja = { id: idDe(lojas.length + 1), nome, ativo: true };
      lojas.push(loja);
      return loja;
    },
    async atualizarNome(id, nome) {
      if (existe(nome, id)) throw new NomeDuplicadoError();
      const loja = lojas.find((l) => l.id === id);
      if (!loja) return null;
      loja.nome = nome;
      return loja;
    },
    async atualizarAtivo(id, ativo) {
      const loja = lojas.find((l) => l.id === id);
      if (!loja) return null;
      loja.ativo = ativo;
      return loja;
    },
    async obter(id) {
      return lojas.find((l) => l.id === id) ?? null;
    },
  };
}

describe("criarLoja", () => {
  it("grava a loja com nome aparado e ela aparece na listagem", async () => {
    const repo = repositorioFalso();
    const r = await criarLoja(repo, { nome: "  Loja Centro  " });
    expect(r.ok).toBe(true);
    const lista = await listarLojas(repo, { pagina: 1 });
    expect(lista.itens.map((l) => l.nome)).toEqual(["Loja Centro"]);
  });

  it("rejeita nome vazio ou só com espaços", async () => {
    const repo = repositorioFalso();
    for (const nome of ["", "   "]) {
      const r = await criarLoja(repo, { nome });
      expect(r).toEqual({
        ok: false,
        erros: { nome: MENSAGEM_NOME_OBRIGATORIO },
      });
    }
    expect(repo.lojas).toHaveLength(0);
  });

  it("rejeita nome duplicado sem diferenciar maiúsculas", async () => {
    const repo = repositorioFalso();
    await criarLoja(repo, { nome: "Centro" });
    const r = await criarLoja(repo, { nome: " CENTRO " });
    expect(r).toEqual({ ok: false, erros: { nome: MENSAGEM_NOME_DUPLICADO } });
    expect(repo.lojas).toHaveLength(1);
  });

  it("não devolve erro cru do repositório", async () => {
    const repo = repositorioFalso();
    repo.inserir = async () => {
      throw new Error("duplicate key value violates constraint xyz");
    };
    const r = await criarLoja(repo, { nome: "A" });
    expect(r.ok).toBe(false);
    expect(JSON.stringify(r)).not.toContain("xyz");
  });
});

describe("editarLoja", () => {
  it("renomeia e rejeita nome já usado por outra loja", async () => {
    const repo = repositorioFalso();
    await criarLoja(repo, { nome: "A" });
    await criarLoja(repo, { nome: "B" });
    expect((await editarLoja(repo, ID1, { nome: "A2" })).ok).toBe(true);
    const r = await editarLoja(repo, ID1, { nome: "b" });
    expect(r).toEqual({ ok: false, erros: { nome: MENSAGEM_NOME_DUPLICADO } });
  });

  it("permite salvar o mesmo nome da própria loja", async () => {
    const repo = repositorioFalso();
    await criarLoja(repo, { nome: "A" });
    expect((await editarLoja(repo, ID1, { nome: "A" })).ok).toBe(true);
  });

  it("loja inexistente devolve erro geral", async () => {
    const r = await editarLoja(repositorioFalso(), "x", { nome: "A" });
    expect(r.ok).toBe(false);
  });
});

describe("definirAtivoLoja", () => {
  it("desativa e reativa a loja sem apagá-la", async () => {
    const repo = repositorioFalso();
    await criarLoja(repo, { nome: "A" });
    await definirAtivoLoja(repo, ID1, false);
    expect(repo.lojas[0]?.ativo).toBe(false);
    await definirAtivoLoja(repo, ID1, true);
    expect(repo.lojas[0]?.ativo).toBe(true);
    expect(repo.lojas).toHaveLength(1);
  });
});

const UUID = "11111111-1111-4111-8111-111111111111";

describe("validação de entrada", () => {
  it("editarLoja rejeita id que não é uuid sem chamar o repositório", async () => {
    const repo = repositorioFalso();
    repo.atualizarNome = async () => {
      throw new Error("não deveria chamar");
    };
    const r = await editarLoja(repo, "abc", { nome: "A" });
    expect(r).toEqual({ ok: false, erros: { geral: MENSAGEM_ERRO_GENERICO } });
  });

  it("definirAtivoLoja rejeita id inválido", async () => {
    const r = await definirAtivoLoja(repositorioFalso(), "abc", true);
    expect(r).toEqual({ ok: false, erros: { geral: MENSAGEM_ERRO_GENERICO } });
  });

  it("definirAtivoLoja rejeita ativo que não é booleano", async () => {
    const r = await definirAtivoLoja(
      repositorioFalso(),
      UUID,
      "true" as unknown as boolean,
    );
    expect(r).toEqual({ ok: false, erros: { geral: MENSAGEM_ERRO_GENERICO } });
  });
});

describe("obterLoja", () => {
  it("devolve a loja existente", async () => {
    const repo = repositorioFalso();
    repo.lojas.push({ id: UUID, nome: "A", ativo: true });
    expect(await obterLoja(repo, UUID)).toEqual({
      id: UUID,
      nome: "A",
      ativo: true,
    });
  });

  it("devolve null para id inválido ou inexistente", async () => {
    const repo = repositorioFalso();
    expect(await obterLoja(repo, "abc")).toBeNull();
    expect(await obterLoja(repo, UUID)).toBeNull();
  });
});

describe("erro tipado", () => {
  it("LojaErroDesconhecidoError usa mensagem genérica", () => {
    const e = new LojaErroDesconhecidoError();
    expect(e.name).toBe("LojaErroDesconhecidoError");
    expect(e.message).toBe(MENSAGEM_ERRO_GENERICO);
  });
});

describe("listarLojas", () => {
  it("pagina e normaliza página inválida", async () => {
    const repo = repositorioFalso();
    for (let i = 0; i < TAMANHO_PAGINA_PADRAO + 2; i++) {
      await criarLoja(repo, { nome: `Loja ${i}` });
    }
    const p1 = await listarLojas(repo, { pagina: 1 });
    const p2 = await listarLojas(repo, { pagina: 2 });
    expect(p1.itens).toHaveLength(TAMANHO_PAGINA_PADRAO);
    expect(p2.itens).toHaveLength(2);
    expect(p1.totalPaginas).toBe(2);
    const ruim = await listarLojas(repo, { pagina: Number.NaN });
    expect(ruim.pagina).toBe(1);
  });
});
