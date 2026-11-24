// PreToolUse de agent de implementação. Uso: node guarda-escopo.mjs <agent>
// Lê .claude/hooks/<agent>/config.json (pastas permitidas).
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  ARQUIVOS_PROTEGIDOS,
  bloquear,
  comandoProibido,
  lerEntrada,
  relativo,
} from "../_lib.mjs";

const agent = process.argv[2] ?? "";
const dir = path.dirname(fileURLToPath(import.meta.url));
let config;
try {
  config = JSON.parse(
    readFileSync(path.join(dir, "..", agent, "config.json"), "utf8"),
  );
} catch {
  bloquear(
    `hook sem configuração para "${agent}" (.claude/hooks/${agent}/config.json). Falhando fechado por segurança.`,
  );
}

const entrada = lerEntrada();
const ferramenta = entrada.tool_name;
const params = entrada.tool_input ?? {};
if (!ferramenta)
  bloquear("entrada do hook ilegível; falhando fechado por segurança.");

if (ferramenta === "Bash") {
  const motivo = comandoProibido(String(params.command ?? ""));
  if (motivo) bloquear(`${agent} não pode rodar este comando: ${motivo}.`);
  process.exit(0);
}

if (
  ferramenta === "Write" ||
  ferramenta === "Edit" ||
  ferramenta === "NotebookEdit"
) {
  const alvo = relativo(String(params.file_path ?? params.notebook_path ?? ""));
  if (alvo.startsWith(".."))
    bloquear(`${agent} não pode editar fora do projeto (${alvo}).`);

  for (const [regex, motivo] of ARQUIVOS_PROTEGIDOS) {
    if (regex.test(alvo))
      bloquear(`${agent} não pode editar ${alvo}: ${motivo}.`);
  }

  const comuns = [
    "docs/CHANGELOG.md",
    "PENDENCIAS.md",
    "docs/decisoes-em-aberto.md",
    `docs/modulos/${config.modulo}.md`,
  ];
  const permitido =
    comuns.includes(alvo) ||
    config.pastasPermitidas.some((p) => alvo === p || alvo.startsWith(p));
  if (!permitido) {
    bloquear(
      `${agent} só pode editar: ${config.pastasPermitidas.join(", ")} e os docs do módulo. ` +
        `Tentou editar ${alvo}. Se a mudança é necessária, devolva ao agente primário indicando qual agent é dono dessa pasta.`,
    );
  }
}
process.exit(0);
