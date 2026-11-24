// Gera os harnesses de outras IAs a partir da FONTE ÚNICA (.claude/ e CLAUDE.md).
//   .claude/rules/*.md      -> .agents/rules/*.md (Antigravity) e .opencode/instrucoes/<rule>/AGENTS.md
//   .claude/skills/*        -> .agents/skills/*
//   .claude/agents/*.md     -> .agents/agents/*.md, .opencode/agents/*.md, .gemini/agents/*.md
//   CLAUDE.md (índice)      -> bloco de índice do GEMINI.md
// Uso: node scripts/sync-harness.ts            (grava; só reescreve o que mudou)
//      node scripts/sync-harness.ts --check    (não grava; lista divergências; exit 1 se houver)
// Não existe sentido inverso: mudança feita direto nos harnesses gerados aparece como DIVERGÊNCIA
// e deve ser promovida à mão para .claude/ (a fonte), nunca sobrescrita em silêncio.
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";

const RAIZ = process.env.CLAUDE_PROJECT_DIR || process.cwd();
const CHECK = process.argv.includes("--check");
const abs = (p: string) => path.join(RAIZ, p);
const ler = (p: string) => readFileSync(abs(p), "utf8").replace(/\r\n/g, "\n");
const listar = (dir: string) =>
  existsSync(abs(dir)) ? readdirSync(abs(dir), { withFileTypes: true }) : [];

const esperados = new Map<string, string>(); // caminho relativo -> conteúdo gerado

type Fonte = {
  meta: Record<string, string>;
  listas: Record<string, string[]>;
  corpo: string;
};

function parse(texto: string): Fonte {
  const m = texto.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  const meta: Record<string, string> = {};
  const listas: Record<string, string[]> = {};
  if (!m) return { meta, listas, corpo: texto };
  let atual: string | null = null;
  for (const linha of (m[1] ?? "").split("\n")) {
    const item = linha.match(/^\s+-\s+(.*)$/);
    if (item && atual && !(atual in meta && meta[atual])) {
      const atualLista = listas[atual] ?? [];
      atualLista.push((item[1] ?? "").replace(/^["']|["']$/g, ""));
      listas[atual] = atualLista;
      continue;
    }
    const kv = linha.match(/^([\w-]+):\s*(.*)$/);
    if (kv) {
      atual = kv[1] ?? null;
      if (atual) meta[atual] = (kv[2] ?? "").trim();
    }
  }
  return { meta, listas, corpo: m[2] ?? "" };
}

// "Agent(a, b), Read, Grep" -> ["Agent", "Read", "Grep"] (ignora argumentos entre parênteses)
const ferramentas = (s: string) =>
  s
    .replace(/\([^)]*\)/g, "")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);

const aviso = (origem: string) =>
  `<!-- GERADO por scripts/sync-harness.ts a partir de ${origem}. Não edite aqui: edite a fonte e rode o script. -->`;

const planejar = (rel: string, conteudo: string) =>
  esperados.set(rel, conteudo);

// ---------- Rules -> .agents/rules e .opencode/instrucoes ----------
for (const e of listar(".claude/rules").filter(
  (x) => x.isFile() && x.name.endsWith(".md"),
)) {
  const origem = `.claude/rules/${e.name}`;
  const { listas, corpo } = parse(ler(origem));
  const paths = listas.paths ?? [];
  const nome = e.name.replace(/\.md$/, "");
  const cab = paths.length
    ? `---\ntrigger: glob\nglobs: "${paths.join(", ")}"\n---\n`
    : `---\ntrigger: always_on\n---\n`;
  planejar(
    `.agents/rules/${e.name}`,
    `${cab}${aviso(origem)}\n${corpo.replace(/^\n+/, "")}`,
  );
  if (paths.length)
    planejar(
      `.opencode/instrucoes/${nome}/AGENTS.md`,
      `${aviso(origem)}\n\nAplica-se somente quando o trabalho envolver: ${paths.join(", ")}\n\n${corpo.replace(/^\n+/, "")}`,
    );
}

// ---------- Skills -> .agents/skills ----------
function copiarSkill(dirRel: string, destRel: string) {
  for (const e of listar(dirRel)) {
    const o = `${dirRel}/${e.name}`;
    const d = `${destRel}/${e.name}`;
    if (e.isDirectory()) copiarSkill(o, d);
    else if (e.name === "SKILL.md") {
      const t = ler(o);
      const fim = t.indexOf("\n---", 4);
      const corpo = fim > 0 ? t.slice(fim + 4).replace(/^\n+/, "") : t;
      const cab = fim > 0 ? t.slice(0, fim + 4) : "";
      planejar(d, `${cab}\n${aviso(o)}\n${corpo}`);
    } else if (/\.(md|txt|json|ts|mjs|sql)$/.test(e.name)) planejar(d, ler(o));
  }
}
for (const s of listar(".claude/skills").filter((x) => x.isDirectory()))
  copiarSkill(`.claude/skills/${s.name}`, `.agents/skills/${s.name}`);

// ---------- Agents ----------
const MAPA_ANTI: Record<string, string[]> = {
  Read: ["view_file"],
  Grep: ["grep_search"],
  Glob: ["find_by_name", "list_dir"],
  Edit: ["replace_file_content", "multi_replace_file_content"],
  Write: ["write_to_file"],
  Bash: ["run_command"],
  AskUserQuestion: ["ask_question"],
  Agent: ["invoke_subagent"],
};
const MAPA_GEMINI: Record<string, string> = {
  Read: "read_file",
  Grep: "search_file_content",
  Glob: "glob",
  Edit: "replace",
  Write: "write_file",
  Bash: "run_shell_command",
};
const MAPA_OPEN = ["read", "grep", "glob", "edit", "write", "bash"] as const;
const OPEN_DE: Record<string, (typeof MAPA_OPEN)[number]> = {
  Read: "read",
  Grep: "grep",
  Glob: "glob",
  Edit: "edit",
  Write: "write",
  Bash: "bash",
};
const MODELO_OPEN: Record<string, string> = {
  sonnet: "anthropic/claude-sonnet-5-5",
  haiku: "anthropic/claude-haiku-5-5",
  opus: "anthropic/claude-opus-5-5",
};
const MODELO_GEMINI: Record<string, string> = {
  sonnet: "gemini-2.5-pro",
  haiku: "gemini-2.5-flash",
  opus: "gemini-2.5-pro",
};

for (const e of listar(".claude/agents").filter(
  (x) => x.isFile() && x.name.endsWith(".md"),
)) {
  const origem = `.claude/agents/${e.name}`;
  const { meta, listas, corpo } = parse(ler(origem));
  const nome = meta.name ?? e.name.replace(/\.md$/, "");
  const desc = meta.description ?? "";
  const tools = ferramentas(meta.tools ?? "");
  const modelo = meta.model ?? "sonnet";
  const skills = listas.skills ?? [];
  const principal = nome === "orquestrador";
  const notaSkills = skills.length
    ? `\nSkills deste agent: leia .claude/skills/<skill>/SKILL.md de ${skills.join(", ")} (o harness não as injeta pelo frontmatter).\n`
    : "";

  // Antigravity
  const toolsAnti = [...new Set(tools.flatMap((t) => MAPA_ANTI[t] ?? []))];
  planejar(
    `.agents/agents/${nome}.md`,
    `---\nname: ${nome}\ndescription: ${desc}\ntools:\n${toolsAnti.map((t) => `  - ${t}`).join("\n")}\nmodel: ${modelo === "haiku" ? "flash" : "inherit"}\nmainAgent: ${principal}\nsubagent: ${!principal}\n${skills.length ? `skills:\n${skills.map((s) => `  - ${s}`).join("\n")}\n` : ""}---\n\n${aviso(origem)}\n${corpo.replace(/^\n+/, "")}${notaSkills}`,
  );

  // OpenCode (o orquestrador tem versão própria, mantida à mão: mode primary + permission.task)
  if (!principal) {
    const ligadas = new Set(tools.map((t) => OPEN_DE[t]).filter(Boolean));
    planejar(
      `.opencode/agents/${nome}.md`,
      `---\ndescription: ${desc}\nmode: subagent\nmodel: ${MODELO_OPEN[modelo] ?? MODELO_OPEN.sonnet}\ntools:\n${MAPA_OPEN.map((t) => `  ${t}: ${ligadas.has(t)}`).join("\n")}\n---\n\n${aviso(origem)}\n${corpo.replace(/^\n+/, "")}${notaSkills}`,
    );
    // Gemini CLI
    planejar(
      `.gemini/agents/${nome}.md`,
      `---\nname: ${nome}\ndescription: ${desc}\nkind: local\ntools:\n${tools
        .map((t) => MAPA_GEMINI[t])
        .filter(Boolean)
        .map((t) => `  - ${t}`)
        .join(
          "\n",
        )}\nmodel: ${MODELO_GEMINI[modelo] ?? MODELO_GEMINI.sonnet}\n---\n\n${aviso(origem)}\n${corpo.replace(/^\n+/, "")}${notaSkills}`,
    );
  }
}

// ---------- MCP: .mcp.json (fonte) -> .agents/mcp_config.json (Antigravity) ----------
if (existsSync(abs(".mcp.json"))) {
  const fonte = JSON.parse(ler(".mcp.json")) as {
    mcpServers?: Record<
      string,
      { command?: string; args?: string[]; env?: Record<string, string> }
    >;
  };
  const servidores = Object.fromEntries(
    Object.entries(fonte.mcpServers ?? {}).map(([nome, s]) => [
      nome,
      { command: s.command, args: s.args, ...(s.env ? { env: s.env } : {}) },
    ]),
  );
  planejar(
    ".agents/mcp_config.json",
    `${JSON.stringify({ mcpServers: servidores }, null, 2)}\n`,
  );
}

// ---------- Hooks do Antigravity (proteções globais, via adaptador) ----------
planejar(
  ".agents/hooks.json",
  `${JSON.stringify(
    {
      "protecoes-estoquefacil": {
        PreToolUse: [
          {
            matcher:
              "run_command|write_to_file|replace_file_content|multi_replace_file_content",
            hooks: [
              {
                type: "command",
                command: "node scripts/antigravity-hook.mjs",
                timeout: 10,
              },
            ],
          },
        ],
      },
    },
    null,
    2,
  )}\n`,
);

// ---------- GEMINI.md: bloco de índice gerado do CLAUDE.md ----------
const claude = ler("CLAUDE.md");
const indice =
  claude
    .match(/## Índice de módulos[^\n]*\n\n?([\s\S]*?)(?=\n## |\s*$)/)?.[1]
    ?.trim() ?? "";
const INI =
  "<!-- INDICE:INICIO (gerado de CLAUDE.md por scripts/sync-harness.ts; não edite) -->";
const FIM = "<!-- INDICE:FIM -->";
const bloco = `${INI}\n${indice}\n${FIM}`;
const gemini = existsSync(abs("GEMINI.md")) ? ler("GEMINI.md") : "";
if (gemini.includes(INI) && gemini.includes(FIM)) {
  planejar(
    "GEMINI.md",
    gemini.replace(
      new RegExp(`${INI.replace(/[()]/g, "\\$&")}[\\s\\S]*?${FIM}`),
      bloco,
    ),
  );
} else if (gemini) {
  console.log(
    "AVISO GEMINI.md existe sem os marcadores de índice; não alterado.",
  );
}

// ---------- Aplicar ou checar ----------
let escritos = 0;
let iguais = 0;
const divergencias: string[] = [];
for (const [rel, conteudo] of esperados) {
  const atual = existsSync(abs(rel)) ? ler(rel) : null;
  if (atual === conteudo) {
    iguais++;
    continue;
  }
  if (CHECK) {
    divergencias.push(`${atual === null ? "FALTA" : "DIVERGE"} ${rel}`);
    continue;
  }
  mkdirSync(path.dirname(abs(rel)), { recursive: true });
  writeFileSync(abs(rel), conteudo);
  escritos++;
}

// Arquivos em pastas geradas que a fonte não produz (criados ou editados direto no harness)
const GERADAS = [
  ".agents/rules",
  ".agents/skills",
  ".agents/agents",
  ".gemini/agents",
];
const orfaos: string[] = [];
const varrer = (dir: string) => {
  for (const e of listar(dir)) {
    const rel = `${dir}/${e.name}`;
    if (e.isDirectory()) varrer(rel);
    else if (!esperados.has(rel)) orfaos.push(rel);
  }
};
for (const g of GERADAS) varrer(g);
for (const o of orfaos)
  divergencias.push(
    `ORFÃO ${o} (não vem de .claude/; promova para a fonte ou apague)`,
  );

for (const d of divergencias) console.log(d);
if (CHECK) {
  console.log(
    `sync-harness --check: ${iguais} em dia, ${divergencias.length} divergência(s).`,
  );
  process.exit(divergencias.length ? 1 : 0);
}
console.log(
  `sync-harness: ${escritos} arquivo(s) atualizado(s), ${iguais} em dia${orfaos.length ? `, ${orfaos.length} órfão(s) a revisar` : ""}.`,
);
