// PostToolUse (modo "post") e Stop (modo "stop") de agent de implementação.
// Uso: node testes-modulo.mjs <agent> <post|stop>

import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { lerEntrada, raiz, relativo } from "../_lib.mjs";

const [agent = "", modo = "post"] = process.argv.slice(2);
const dir = path.dirname(fileURLToPath(import.meta.url));
let config;
try {
  config = JSON.parse(
    readFileSync(path.join(dir, "..", agent, "config.json"), "utf8"),
  );
} catch {
  process.exit(0); // sem config não há o que testar; o PreToolUse já falha fechado
}

const entrada = lerEntrada();

if (modo === "stop" && entrada.stop_hook_active) process.exit(0); // evita laço infinito
if (modo === "post") {
  const alvo = relativo(String(entrada.tool_input?.file_path ?? ""));
  if (!alvo.startsWith("src/")) process.exit(0); // só roda ao editar código; em TDD o teste nasce falhando
}

const pastas = (config.testes ?? []).filter((p) =>
  existsSync(path.join(raiz(), p)),
);
if (pastas.length === 0) process.exit(0); // módulo ainda sem testes

const r = spawnSync("npx", ["vitest", "run", ...pastas], {
  cwd: raiz(),
  shell: true,
  encoding: "utf8",
  timeout: 180000,
});
const saida = `${r.stdout ?? ""}${r.stderr ?? ""}`;
if (r.status === 0 || /No test files found/i.test(saida)) process.exit(0);

const fim = saida.trim().split("\n").slice(-25).join("\n");
const quando = modo === "stop" ? "Não encerre ainda: " : "";
if (/reading 'config'/.test(saida)) {
  const nomes = Object.keys(process.env).sort().join(" ");
  process.stderr.write(
    `[diagnóstico] cwd=${process.cwd()} node=${process.version} env=${nomes}\n`,
  );
}
process.stderr.write(
  `${quando}os testes de ${config.modulo} estão falhando (${pastas.join(", ")}). Corrija antes de continuar.\n${fim}\n`,
);
process.exit(2);
