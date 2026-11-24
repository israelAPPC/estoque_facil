// Hook global (Stop): avisa quando o contexto fixo cresce demais. Só avisa (exit 0).
import { spawnSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { raiz } from "../_lib.mjs";

import { LIMITE_CLAUDE_MD, LIMITE_RULES } from "./limites.mjs";

const tamanho = (p) => (existsSync(p) ? statSync(p).size : 0);
const claudeMd = tamanho(path.join(raiz(), "CLAUDE.md"));

// Rules incondicionais = .claude/rules/**/*.md SEM "paths:" no frontmatter.
function listar(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    return e.isDirectory() ? listar(p) : e.name.endsWith(".md") ? [p] : [];
  });
}
let rules = 0;
const detalhe = [];
for (const arquivo of listar(path.join(raiz(), ".claude", "rules"))) {
  const texto = readFileSync(arquivo, "utf8");
  const cabecalho = texto.startsWith("---")
    ? (texto.split("---")[1] ?? "")
    : "";
  if (!/^paths:/m.test(cabecalho)) {
    rules += Buffer.byteLength(texto);
    detalhe.push(path.basename(arquivo));
  }
}

const avisos = [];
const kb = (n) => (n / 1024).toFixed(1);
if (claudeMd > LIMITE_CLAUDE_MD) {
  avisos.push(`CLAUDE.md tem ${kb(claudeMd)} KB (limite ~10 KB).`);
}
if (rules > LIMITE_RULES) {
  avisos.push(
    `As rules incondicionais somam ${kb(rules)} KB, cerca de ${Math.round(rules / 4)} tokens (limite ~3k): ${detalhe.join(", ")}.`,
  );
}
const partes = [];
if (avisos.length) {
  partes.push(
    "Orçamento de contexto estourado. " +
      avisos.join(" ") +
      " Mova o excesso para docs/modulos/, docs/CHANGELOG.md ou rules com 'paths:'.",
  );
}
try {
  const r = spawnSync(
    process.execPath,
    [path.join(raiz(), "scripts", "verificar-docs.mjs"), "--aviso"],
    {
      encoding: "utf8",
      timeout: 8000,
      env: process.env,
    },
  );
  if (r.stdout?.trim())
    partes.push(
      `${r.stdout.trim()} Rode node scripts/verificar-docs.mjs para ver tudo.`,
    );
} catch {
  // verificador é informativo: ignora falha
}
// Mantém .agents/, .opencode/ e .gemini/ em sincronia com .claude/ (só reescreve o que mudou).
try {
  const s = spawnSync(
    process.execPath,
    [
      "--disable-warning=ExperimentalWarning",
      path.join(raiz(), "scripts", "sync-harness.ts"),
    ],
    { encoding: "utf8", timeout: 15000, env: process.env },
  );
  const orfaos = (s.stdout ?? "")
    .split("\n")
    .filter((l) => l.startsWith("ORFÃO"));
  if (orfaos.length)
    partes.push(
      `sync-harness: ${orfaos.length} arquivo(s) criado(s) direto em .agents/ ou .gemini/ (promova para .claude/): ${orfaos
        .map((l) => l.split(" ")[1])
        .join(", ")}.`,
    );
} catch {
  // sincronização é informativa: ignora falha
}
if (partes.length)
  process.stdout.write(JSON.stringify({ systemMessage: partes.join(" ") }));
process.exit(0);
