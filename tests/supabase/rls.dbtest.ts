import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

// Roda só com `npm run test:db`, contra um projeto Supabase de TESTE.
// Variáveis vêm do ambiente do shell; este arquivo não lê .env.

type Ambiente = { url: string; anonKey: string; email: string; senha: string };

function lerAmbiente(): Ambiente {
  const url = process.env.TEST_SUPABASE_URL;
  const anonKey = process.env.TEST_SUPABASE_ANON_KEY;
  const email = process.env.TEST_SUPABASE_EMAIL;
  const senha = process.env.TEST_SUPABASE_PASSWORD;
  if (!url || !anonKey || !email || !senha) {
    throw new Error(
      "Defina TEST_SUPABASE_URL, TEST_SUPABASE_ANON_KEY, TEST_SUPABASE_EMAIL e TEST_SUPABASE_PASSWORD (projeto de teste).",
    );
  }
  return { url: url.replace(/\/$/, ""), anonKey, email, senha };
}

const TABELAS = [
  "lojas",
  "produtos",
  "contagens",
  "contagem_itens",
  "requisicoes",
  "requisicao_itens",
  "estoque_atual",
  "produto_lojas",
] as const;

const env = lerAmbiente();
let token = "";
let usuarioId = "";

// HTTP de bloqueio por permissão/RLS no PostgREST (não confundir com 400 de validação).
const BLOQUEIO_PERMISSAO = [401, 403];

// Corpo válido por tabela: prova que o bloqueio vem de RLS/grant, não de campo vazio.
// IDs aleatórios: a checagem de permissão acontece antes da FK.
function corpoValido(
  tabela: (typeof TABELAS)[number],
): Record<string, unknown> {
  const agora = new Date().toISOString();
  switch (tabela) {
    case "lojas":
      return { nome: `Anon ${randomUUID()}` };
    case "produtos":
      return { sku: `ANON-${randomUUID()}`, nome: "Anon", fator_caixa: 1 };
    case "contagens":
      return { loja_id: randomUUID(), data_contagem: agora };
    case "contagem_itens":
      return {
        contagem_id: randomUUID(),
        produto_id: randomUUID(),
        quantidade_unidades: 1,
      };
    case "requisicoes":
      return { tipo: "consumo", loja_id: randomUUID(), data_movimento: agora };
    case "requisicao_itens":
      return {
        requisicao_id: randomUUID(),
        produto_id: randomUUID(),
        quantidade_unidades: 1,
      };
    case "produto_lojas":
      return { produto_id: randomUUID(), loja_id: randomUUID() };
    case "estoque_atual":
      return {
        loja_id: randomUUID(),
        produto_id: randomUUID(),
        quantidade_unidades: 1,
      };
  }
}

async function rest(
  caminho: string,
  init: { method?: string; body?: unknown; autenticado: boolean },
): Promise<Response> {
  const headers: Record<string, string> = {
    apikey: env.anonKey,
    Authorization: `Bearer ${init.autenticado ? token : env.anonKey}`,
    "Content-Type": "application/json",
    Prefer: "return=representation",
  };
  return fetch(`${env.url}/rest/v1/${caminho}`, {
    method: init.method ?? "GET",
    headers,
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
  });
}

async function inserir<T>(tabela: string, body: unknown): Promise<T> {
  const r = await rest(tabela, { method: "POST", body, autenticado: true });
  expect(r.status, `insert em ${tabela}`).toBe(201);
  const linhas = (await r.json()) as T[];
  const linha = linhas[0];
  if (!linha) throw new Error(`insert em ${tabela} não devolveu linha`);
  return linha;
}

beforeAll(async () => {
  const r = await fetch(`${env.url}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: { apikey: env.anonKey, "Content-Type": "application/json" },
    body: JSON.stringify({ email: env.email, password: env.senha }),
  });
  expect(r.status, "login do usuário de teste").toBe(200);
  const corpo = (await r.json()) as {
    access_token?: string;
    user?: { id?: string };
  };
  token = corpo.access_token ?? "";
  usuarioId = corpo.user?.id ?? "";
  expect(token).not.toBe("");
  expect(usuarioId).not.toBe("");
});

describe("RLS: cliente anônimo", () => {
  it.each(TABELAS)("não lê %s", async (tabela) => {
    const r = await rest(`${tabela}?select=*&limit=1`, { autenticado: false });
    expect(r.ok).toBe(false);
  });

  it.each(TABELAS)("não grava em %s", async (tabela) => {
    const r = await rest(tabela, {
      method: "POST",
      body: corpoValido(tabela),
      autenticado: false,
    });
    expect(BLOQUEIO_PERMISSAO).toContain(r.status);
  });
});

describe("RLS: usuário autenticado", () => {
  const sufixo = randomUUID().slice(0, 8);

  it("lê todas as tabelas", async () => {
    for (const tabela of TABELAS) {
      const r = await rest(`${tabela}?select=*&limit=1`, { autenticado: true });
      expect(r.status, tabela).toBe(200);
    }
  });

  it.each(["requisicoes", "requisicao_itens", "estoque_atual"] as const)(
    "não insere direto em %s (só por função)",
    async (tabela) => {
      const r = await rest(tabela, {
        method: "POST",
        body: corpoValido(tabela),
        autenticado: true,
      });
      expect(BLOQUEIO_PERMISSAO).toContain(r.status);
    },
  );

  it("grava lojas, produtos e contagem rascunho; respeita imutabilidade", async () => {
    const loja = await inserir<{ id: string }>("lojas", {
      nome: `Teste ${sufixo} A`,
    });
    const destino = await inserir<{ id: string }>("lojas", {
      nome: `Teste ${sufixo} B`,
    });
    const produto = await inserir<{ id: string }>("produtos", {
      sku: `T-${sufixo}`,
      nome: "Produto teste",
      fator_caixa: 24,
    });

    // lojas: desativar ok, excluir não
    const upd = await rest(`lojas?id=eq.${loja.id}`, {
      method: "PATCH",
      body: { ativo: true },
      autenticado: true,
    });
    expect(upd.status).toBe(200);
    const del = await rest(`lojas?id=eq.${loja.id}`, {
      method: "DELETE",
      autenticado: true,
    });
    expect(del.ok).toBe(false);

    // contagem em rascunho com item editável
    const contagem = await inserir<{ id: string }>("contagens", {
      loja_id: loja.id,
      data_contagem: new Date().toISOString(),
    });
    await inserir("contagem_itens", {
      contagem_id: contagem.id,
      produto_id: produto.id,
      quantidade_unidades: 82,
    });
    const editaItem = await rest(
      `contagem_itens?contagem_id=eq.${contagem.id}`,
      { method: "PATCH", body: { quantidade_unidades: 80 }, autenticado: true },
    );
    expect(editaItem.status).toBe(200);

    // cliente não confirma contagem direto (só função SQL), mesmo com omitidos válido
    const confirma = await rest(`contagens?id=eq.${contagem.id}`, {
      method: "PATCH",
      body: {
        status: "confirmada",
        omitidos: "manter",
        confirmada_em: new Date().toISOString(),
      },
      autenticado: true,
    });
    expect(confirma.ok).toBe(false);

    // requisição direta é negada mesmo com corpo válido
    const req = await rest("requisicoes", {
      method: "POST",
      body: {
        tipo: "transferencia",
        loja_id: loja.id,
        loja_destino_id: destino.id,
        data_movimento: new Date().toISOString(),
      },
      autenticado: true,
    });
    expect(BLOQUEIO_PERMISSAO).toContain(req.status);

    // estoque_atual: só leitura
    const gravaSaldo = await rest("estoque_atual", {
      method: "POST",
      body: {
        loja_id: loja.id,
        produto_id: produto.id,
        quantidade_unidades: 1,
      },
      autenticado: true,
    });
    expect(BLOQUEIO_PERMISSAO).toContain(gravaSaldo.status);
  });

  it("usuário não grava inicial = true; apagar rascunho exige apagar itens antes", async () => {
    const loja = await inserir<{ id: string }>("lojas", {
      nome: `Teste ${sufixo} inicial`,
    });
    const produto = await inserir<{ id: string }>("produtos", {
      sku: `I-${sufixo}`,
      nome: "Produto inicial",
    });

    const insereInicial = await rest("contagens", {
      method: "POST",
      body: {
        loja_id: loja.id,
        data_contagem: new Date().toISOString(),
        inicial: true,
      },
      autenticado: true,
    });
    expect(insereInicial.ok).toBe(false);

    const contagem = await inserir<{ id: string }>("contagens", {
      loja_id: loja.id,
      data_contagem: new Date().toISOString(),
    });
    const marcaInicial = await rest(`contagens?id=eq.${contagem.id}`, {
      method: "PATCH",
      body: { inicial: true },
      autenticado: true,
    });
    expect(marcaInicial.ok).toBe(false);

    await inserir("contagem_itens", {
      contagem_id: contagem.id,
      produto_id: produto.id,
      quantidade_unidades: 5,
    });
    const apagaComItens = await rest(`contagens?id=eq.${contagem.id}`, {
      method: "DELETE",
      autenticado: true,
    });
    expect(apagaComItens.ok).toBe(false);

    const apagaItens = await rest(
      `contagem_itens?contagem_id=eq.${contagem.id}`,
      { method: "DELETE", autenticado: true },
    );
    expect(apagaItens.ok).toBe(true);
    const apagaRascunho = await rest(`contagens?id=eq.${contagem.id}`, {
      method: "DELETE",
      autenticado: true,
    });
    expect(apagaRascunho.ok).toBe(true);
  });

  it("criado_por enviado pelo cliente é ignorado e não pode ser trocado", async () => {
    const loja = await inserir<{ id: string }>("lojas", {
      nome: `Teste ${sufixo} autor`,
    });
    const falso = randomUUID();
    const contagem = await inserir<{ id: string; criado_por: string }>(
      "contagens",
      {
        loja_id: loja.id,
        data_contagem: new Date().toISOString(),
        criado_por: falso,
      },
    );
    expect(contagem.criado_por).toBe(usuarioId);

    const troca = await rest(`contagens?id=eq.${contagem.id}`, {
      method: "PATCH",
      body: { criado_por: falso },
      autenticado: true,
    });
    expect(troca.status).toBe(200);
    const [depois] = (await troca.json()) as { criado_por: string }[];
    expect(depois?.criado_por).toBe(usuarioId);
  });
});

type Linha = Record<string, unknown>;

async function rpc(
  nome: string,
  body: unknown,
  autenticado: boolean,
): Promise<Response> {
  return rest(`rpc/${nome}`, { method: "POST", body, autenticado });
}

describe("produto_lojas e RPCs (migrações 0002 a 0004)", () => {
  const sufixo = randomUUID().slice(0, 8);
  const lojasCriadas: string[] = [];
  const produtosCriados: string[] = [];

  async function novaLoja(rotulo: string): Promise<string> {
    const l = await inserir<{ id: string }>("lojas", {
      nome: `Teste PL ${sufixo} ${rotulo}`,
    });
    lojasCriadas.push(l.id);
    return l.id;
  }

  async function novoProduto(rotulo: string, lojas: string[]): Promise<string> {
    const r = await rpc(
      "criar_produto_com_lojas",
      {
        p_sku: `PL-${sufixo}-${rotulo}`,
        p_nome: `Produto PL ${rotulo}`,
        p_categoria: null,
        p_fator_caixa: 1,
        p_estoque_minimo_unidades: 0,
        p_ativo: true,
        p_loja_ids: lojas,
      },
      true,
    );
    expect(r.status, "criar_produto_com_lojas").toBe(200);
    const id = (await r.json()) as string;
    produtosCriados.push(id);
    return id;
  }

  async function vinculos(produtoId: string): Promise<string[]> {
    const r = await rest(
      `produto_lojas?select=loja_id&produto_id=eq.${produtoId}`,
      { autenticado: true },
    );
    expect(r.status).toBe(200);
    return ((await r.json()) as Linha[]).map((x) => x.loja_id as string);
  }

  async function definirAtivo(tabela: string, id: string, ativo: boolean) {
    const r = await rest(`${tabela}?id=eq.${id}`, {
      method: "PATCH",
      body: { ativo },
      autenticado: true,
    });
    expect(r.status, `ativo em ${tabela}`).toBe(200);
  }

  afterAll(async () => {
    // só dados criados aqui: produtos e lojas ficam inativos (soft delete);
    // vínculos das lojas de teste são removidos por id.
    for (const id of produtosCriados) {
      await rest(`produtos?id=eq.${id}`, {
        method: "PATCH",
        body: { ativo: false },
        autenticado: true,
      });
    }
    for (const id of lojasCriadas) {
      await rest(`produto_lojas?loja_id=eq.${id}`, {
        method: "DELETE",
        autenticado: true,
      });
      await rest(`lojas?id=eq.${id}`, {
        method: "PATCH",
        body: { ativo: false },
        autenticado: true,
      });
    }
  });

  it("anon não executa as RPCs", async () => {
    const chamadas: [string, unknown][] = [
      [
        "criar_produto_com_lojas",
        {
          p_sku: `ANON-${sufixo}`,
          p_nome: "Anon",
          p_categoria: null,
          p_fator_caixa: 1,
          p_estoque_minimo_unidades: 0,
          p_ativo: true,
          p_loja_ids: [randomUUID()],
        },
      ],
      [
        "salvar_produto_com_lojas",
        {
          p_produto_id: randomUUID(),
          p_sku: "X",
          p_nome: "X",
          p_categoria: null,
          p_fator_caixa: 1,
          p_estoque_minimo_unidades: 0,
          p_loja_ids: null,
        },
      ],
      [
        "definir_lojas_produto",
        { p_produto_id: randomUUID(), p_loja_ids: [randomUUID()] },
      ],
    ];
    for (const [nome, body] of chamadas) {
      const r = await rpc(nome, body, false);
      expect(BLOQUEIO_PERMISSAO, nome).toContain(r.status);
    }
  });

  it("criar com loja inexistente dá 22023 lojas_invalidas e não grava o produto", async () => {
    const sku = `PL-${sufixo}-inv`;
    const r = await rpc(
      "criar_produto_com_lojas",
      {
        p_sku: sku,
        p_nome: "Inválido",
        p_categoria: null,
        p_fator_caixa: 1,
        p_estoque_minimo_unidades: 0,
        p_ativo: true,
        p_loja_ids: [randomUUID()],
      },
      true,
    );
    expect(r.ok).toBe(false);
    const erro = (await r.json()) as { code?: string; hint?: string };
    expect(erro.code).toBe("22023");
    expect(erro.hint).toBe("lojas_invalidas");
    const busca = await rest(`produtos?select=id&sku=eq.${sku}`, {
      autenticado: true,
    });
    expect((await busca.json()) as Linha[]).toHaveLength(0);
  });

  it("criar com lista vazia dá 22023", async () => {
    const r = await rpc(
      "criar_produto_com_lojas",
      {
        p_sku: `PL-${sufixo}-vazio`,
        p_nome: "Vazio",
        p_categoria: null,
        p_fator_caixa: 1,
        p_estoque_minimo_unidades: 0,
        p_ativo: true,
        p_loja_ids: [],
      },
      true,
    );
    expect(r.ok).toBe(false);
    expect(((await r.json()) as { code?: string }).code).toBe("22023");
  });

  it("salvar não altera ativo, devolve a linha e nulo mantém vínculos", async () => {
    const a = await novaLoja("S-A");
    const b = await novaLoja("S-B");
    const produto = await novoProduto("salvar", [a, b]);
    await definirAtivo("produtos", produto, false);

    const r = await rpc(
      "salvar_produto_com_lojas",
      {
        p_produto_id: produto,
        p_sku: `PL-${sufixo}-salvar`,
        p_nome: "Nome novo",
        p_categoria: "Cat",
        p_fator_caixa: 12,
        p_estoque_minimo_unidades: 3,
        p_loja_ids: null,
      },
      true,
    );
    expect(r.status).toBe(200);
    const linha = (await r.json()) as Linha;
    expect(linha.id).toBe(produto);
    expect(linha.nome).toBe("Nome novo");
    expect(linha.fator_caixa).toBe(12);
    expect(linha.ativo).toBe(false);
    expect((await vinculos(produto)).sort()).toEqual([a, b].sort());
  });

  it("vínculo com loja desativada é preservado ao salvar e ao definir sem ela", async () => {
    const a = await novaLoja("D-A");
    const b = await novaLoja("D-B");
    const produto = await novoProduto("desativada", [a, b]);
    await definirAtivo("lojas", b, false);

    const salvar = await rpc(
      "salvar_produto_com_lojas",
      {
        p_produto_id: produto,
        p_sku: `PL-${sufixo}-desativada`,
        p_nome: "Produto PL desativada",
        p_categoria: null,
        p_fator_caixa: 1,
        p_estoque_minimo_unidades: 0,
        p_loja_ids: [a],
      },
      true,
    );
    expect(salvar.status).toBe(200);
    expect((await vinculos(produto)).sort()).toEqual([a, b].sort());

    const definir = await rpc(
      "definir_lojas_produto",
      { p_produto_id: produto, p_loja_ids: [a] },
      true,
    );
    expect(definir.ok).toBe(true);
    expect((await vinculos(produto)).sort()).toEqual([a, b].sort());
  });

  it("reativar loja vincula produtos ativos sem duplicar; renomear não dispara", async () => {
    const loja = await novaLoja("R");
    const produto = await novoProduto("reativar", [loja]);

    // renomear loja ativa não vincula
    const apaga = await rest(
      `produto_lojas?produto_id=eq.${produto}&loja_id=eq.${loja}`,
      { method: "DELETE", autenticado: true },
    );
    expect(apaga.ok).toBe(true);
    const renomeia = await rest(`lojas?id=eq.${loja}`, {
      method: "PATCH",
      body: { nome: `Teste PL ${sufixo} R renomeada` },
      autenticado: true,
    });
    expect(renomeia.status).toBe(200);
    expect(await vinculos(produto)).toEqual([]);

    // desativar não vincula; reativar vincula uma única vez
    await definirAtivo("lojas", loja, false);
    expect(await vinculos(produto)).toEqual([]);
    await definirAtivo("lojas", loja, true);
    expect(await vinculos(produto)).toEqual([loja]);

    // reativar de novo (já ativa) não duplica nem dá erro
    await definirAtivo("lojas", loja, true);
    expect(await vinculos(produto)).toEqual([loja]);
  });
});
