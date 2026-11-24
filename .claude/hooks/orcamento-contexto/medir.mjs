// Mede o contexto fixo do projeto (só leitura). Usado pelo /auditar-contexto.
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { raiz } from "../_lib.mjs";
import {
  LIMITE_CLAUDE_MD,
  LIMITE_LINHAS_RULE,
  LIMITE_RULES,
} from "./limites.mjs";

const kb = (n) => `${(n / 1024).toFixed(1)} KB (~${Math.round(n / 4)} tokens)`;
const listar = (dir) =>
  !existsSync(dir)
    ? []
    : readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
        const p = path.join(dir, e.name);
        return e.isDirectory() ? listar(p) : e.name.endsWith(".md") ? [p] : [];
      });
const rel = (p) => path.relative(raiz(), p).replaceAll("\\", "/");

const saida = [];
const claudePath = path.join(raiz(), "CLAUDE.md");
const claude = existsSync(claudePath) ? readFileSync(claudePath, "utf8") : "";
const tamClaude = Buffer.byteLength(claude);
saida.push(
  `CLAUDE.md: ${kb(tamClaude)} | limite ${kb(LIMITE_CLAUDE_MD)} | ${tamClaude > LIMITE_CLAUDE_MD ? "ESTOUROU" : "ok"}`,
);

// Seções do CLAUDE.md por tamanho
const secoes = claude.split(/^(?=## )/m).map((s) => ({
  titulo: (s.match(/^##? .*/)?.[0] ?? "(início)").trim(),
  bytes: Buffer.byteLength(s),
}));
saida.push("  Seções (maior primeiro):");
for (const s of secoes.sort((a, b) => b.bytes - a.bytes))
  saida.push(`    ${s.titulo}: ${(s.bytes / 1024).toFixed(1)} KB`);

// Histórico datado dentro do CLAUDE.md
const sinais =
  /\b\d{4}-\d{2}-\d{2}\b|\b\d{2}\/\d{2}\/\d{4}\b|\bv\d+\.\d+(\.\d+)?\b|corrigid[oa] em|changelog:|\bsprint \d+ conclu/i;
const historico = claude
  .split("\n")
  .map((linha, i) => ({ linha, n: i + 1 }))
  .filter((x) => sinais.test(x.linha));
saida.push(
  historico.length
    ? `  Possível histórico datado no CLAUDE.md (${historico.length} linhas):\n${historico.map((x) => `    L${x.n}: ${x.linha.trim().slice(0, 100)}`).join("\n")}`
    : "  Histórico datado no CLAUDE.md: nenhum encontrado",
);

// Rules
let incondicionais = 0;
const linhasRules = [];
for (const arquivo of listar(path.join(raiz(), ".claude", "rules"))) {
  const texto = readFileSync(arquivo, "utf8");
  const cab = texto.startsWith("---") ? (texto.split("---")[1] ?? "") : "";
  const comPaths = /^paths:/m.test(cab);
  const corpo = texto.startsWith("---")
    ? texto.split("---").slice(2).join("---")
    : texto;
  const linhas = corpo.split("\n").filter((l) => l.trim()).length;
  if (!comPaths) incondicionais += Buffer.byteLength(texto);
  linhasRules.push(
    `    ${rel(arquivo)}: ${linhas} linhas, ${(Buffer.byteLength(texto) / 1024).toFixed(1)} KB, ${comPaths ? "com paths" : "INCONDICIONAL"}${linhas > LIMITE_LINHAS_RULE ? " | PASSOU de 30 linhas" : ""}`,
  );
}
saida.push(
  `Rules incondicionais: ${kb(incondicionais)} | limite ${kb(LIMITE_RULES)} | ${incondicionais > LIMITE_RULES ? "ESTOUROU" : "ok"}`,
  ...linhasRules,
);

// docs/modulos
saida.push("docs/modulos/ (só carregam quando lidos):");
const modulos = listar(path.join(raiz(), "docs", "modulos"));
for (const m of modulos)
  saida.push(`    ${rel(m)}: ${(statSync(m).size / 1024).toFixed(1)} KB`);
if (!modulos.length) saida.push("    (vazia)");

console.log(saida.join("\n"));
