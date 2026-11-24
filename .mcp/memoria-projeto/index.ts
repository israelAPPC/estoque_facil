// Servidor MCP "memoria-projeto" (stdio): dá a qualquer IA acesso à memória do projeto.
// Tools: buscar_memoria, registrar_aprendizado, pendencias, doc_modulo.
// Só registrar_aprendizado grava (uma nota em .claude/knowledge/ + índice no rag.db).
// Importante: em stdio, stdout é o protocolo; nada pode ser impresso com console.log.
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { gravarNota, indexar } from "../../.claude/scripts/embed.ts";
import { CATEGORIAS, RAIZ } from "../../.claude/scripts/lib.ts";
import { buscar, formatar } from "../../.claude/scripts/search.ts";

const MAX_SAIDA = 6000;
const texto = (t: string) => ({
  content: [{ type: "text" as const, text: t.slice(0, MAX_SAIDA) }],
});
const erro = (t: string) => ({
  isError: true,
  content: [{ type: "text" as const, text: t }],
});
const lerDoc = (rel: string) => {
  const caminho = path.join(RAIZ, rel);
  return existsSync(caminho)
    ? readFileSync(caminho, "utf8").replace(/\r\n/g, "\n")
    : null;
};

const servidor = new McpServer({ name: "memoria-projeto", version: "1.0.0" });

servidor.registerTool(
  "buscar_memoria",
  {
    description:
      "Busca no rag.db bugs, decisões, padrões e o que não funcionou (até 3 trechos).",
    inputSchema: {
      pergunta: z.string().min(3).max(500),
      agent: z
        .string()
        .max(40)
        .optional()
        .describe("agent ativo, para priorizar trechos afins"),
    },
  },
  async ({ pergunta, agent }) => {
    try {
      const r = formatar(await buscar(pergunta, agent));
      return texto(r || "Nada acima do limiar de similaridade.");
    } catch {
      return erro("Falha ao consultar a memória (rag.db ausente ou vazio?).");
    }
  },
);

servidor.registerTool(
  "registrar_aprendizado",
  {
    description:
      "Grava um aprendizado (sem segredos) no rag.db e em .claude/knowledge/.",
    inputSchema: {
      texto: z.string().min(10).max(2000),
      categoria: z.enum(CATEGORIAS),
      agent: z
        .string()
        .regex(/^[\w-]{1,40}$/)
        .default("mcp"),
    },
  },
  async ({ texto: t, categoria, agent }) => {
    try {
      const arquivo = gravarNota(t, categoria, agent);
      const n = await indexar(arquivo);
      return texto(
        `Registrado em ${path.relative(RAIZ, arquivo).replaceAll("\\", "/")} (${n} trecho(s)).`,
      );
    } catch {
      return erro("Falha ao registrar o aprendizado.");
    }
  },
);

const MODULOS_PEND = ["base", "seg", "imp", "agt", "har", "rag"];
servidor.registerTool(
  "pendencias",
  {
    description:
      "Pendências abertas: sem filtro, Resumo e P0/P1; ou módulo (base|seg|imp|agt|har|rag), P0..P3 ou ID.",
    inputSchema: { filtro: z.string().max(20).optional() },
  },
  async ({ filtro }) => {
    const principal = lerDoc("PENDENCIAS.md") ?? "";
    const f = (filtro ?? "").trim();
    if (!f) {
      const i = principal.indexOf("## Resumo");
      return texto(i >= 0 ? principal.slice(i) : "PENDENCIAS.md sem Resumo.");
    }
    if (MODULOS_PEND.includes(f.toLowerCase()))
      return texto(
        lerDoc(`docs/pendencias/${f.toLowerCase()}.md`) ??
          "Módulo sem pendências.",
      );
    if (/^P[0-3]$/i.test(f)) {
      const todos = MODULOS_PEND.map(
        (m) => lerDoc(`docs/pendencias/${m}.md`) ?? "",
      ).join("\n");
      const alvo = f.toUpperCase();
      const blocos = todos
        .split(/(?=<a id=)/)
        .filter((b) => b.includes(`**${alvo} · `));
      return texto(blocos.join("\n") || `Nenhum item ${alvo} aberto.`);
    }
    if (/^[A-Za-z]+-\d+$/.test(f)) {
      const m = MODULOS_PEND.find((x) => x === f.split("-")[0]?.toLowerCase());
      const doc = m ? lerDoc(`docs/pendencias/${m}.md`) : null;
      const bloco = doc
        ?.split(/(?=<a id=)/)
        .find((b) => b.startsWith(`<a id="${f.toLowerCase()}"`));
      return texto(
        bloco ??
          `ID ${f} não está aberto (veja docs/pendencias-resolvidas.md).`,
      );
    }
    return erro("Filtro inválido. Use módulo, P0..P3 ou um ID (ex.: AGT-001).");
  },
);

servidor.registerTool(
  "doc_modulo",
  {
    description:
      "Lê docs/modulos/<módulo>.md: sem seção lista os títulos; com seção devolve só ela.",
    inputSchema: {
      modulo: z.string().regex(/^[a-z-]{2,30}$/),
      secao: z.string().max(60).optional(),
    },
  },
  async ({ modulo, secao }) => {
    const doc = lerDoc(`docs/modulos/${modulo}.md`);
    if (doc === null)
      return texto(
        `docs/modulos/${modulo}.md ainda não existe (o módulo não foi implementado).`,
      );
    const linhas = doc.split("\n");
    const titulos = linhas
      .map((l, i) => ({ l, i }))
      .filter((x) => /^#{1,4}\s/.test(x.l));
    if (!secao)
      return texto(
        titulos.map((x) => `L${x.i + 1}: ${x.l}`).join("\n") ||
          "Documento sem títulos.",
      );
    const ini = titulos.find((x) =>
      x.l.toLowerCase().includes(secao.toLowerCase()),
    );
    if (!ini)
      return texto(
        `Seção "${secao}" não encontrada. Títulos:\n${titulos.map((x) => x.l).join("\n")}`,
      );
    const nivel = ini.l.match(/^#+/)?.[0].length ?? 1;
    const fim =
      titulos.find(
        (x) => x.i > ini.i && (x.l.match(/^#+/)?.[0].length ?? 9) <= nivel,
      )?.i ?? linhas.length;
    return texto(linhas.slice(ini.i, fim).join("\n"));
  },
);

await servidor.connect(new StdioServerTransport());
