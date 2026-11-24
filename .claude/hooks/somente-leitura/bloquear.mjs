// PreToolUse de agent SOMENTE LEITURA (code-reviewer, story-validator, consultor-squad).
// Bloqueia Write, Edit e Bash. Uso: node bloquear.mjs <agent>
import { bloquear, lerEntrada } from "../_lib.mjs";

const agent = process.argv[2] ?? "agent";
const ferramenta = lerEntrada().tool_name ?? "ferramenta";
bloquear(
  `${agent} é somente leitura e não pode usar ${ferramenta}. ` +
    "Seu papel é analisar e reportar; quem corrige é o agent do módulo. Devolva o relatório com arquivo:linha e o que mudar.",
);
