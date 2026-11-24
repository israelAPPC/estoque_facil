// PreToolUse(Bash) de agent de QA/revisão: só permite comandos de teste, lint e tipos.
// Uso: node somente-testes.mjs <agent>
import {
  bloquear,
  COMANDOS_DE_TESTE,
  ENCADEAMENTO,
  lerEntrada,
} from "../_lib.mjs";

const agent = process.argv[2] ?? "agent";
const comando = String(lerEntrada().tool_input?.command ?? "").trim();

if (
  !comando ||
  ENCADEAMENTO.test(comando) ||
  !COMANDOS_DE_TESTE.some((r) => r.test(comando))
) {
  bloquear(
    `${agent} só pode rodar testes, lint e tipos (npm test, npm run lint, npm run typecheck, npx vitest, npx biome check, npx tsc --noEmit), ` +
      `sem encadear comandos. Tentou: "${comando}".`,
  );
}
process.exit(0);
