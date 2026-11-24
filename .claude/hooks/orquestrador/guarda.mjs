// PreToolUse do orquestrador (agente principal). Ele coordena e documenta, mas não escreve código.
// - Write/Edit: só docs/, PENDENCIAS.md, PLAN.md e CLAUDE.md.
// - Bash: só verificações (lint, tipos, testes, build) e os scripts de contexto.
import {
  bloquear,
  COMANDOS_DE_TESTE,
  comandoProibido,
  ENCADEAMENTO,
  lerEntrada,
  relativo,
} from "../_lib.mjs";

const entrada = lerEntrada();
const ferramenta = entrada.tool_name;
const params = entrada.tool_input ?? {};
if (!ferramenta)
  bloquear("entrada do hook ilegível; falhando fechado por segurança.");
// Chamadas de subagent trazem agent_id; a guarda vale só para o orquestrador (sessão principal).
if (entrada.agent_id) process.exit(0);
if (ferramenta === "Bash") {
  const comando = String(params.command ?? "").trim();
  // Git local liberado só para o orquestrador (decisão do usuário, 2026-11-24).
  // Push, reset, rebase e similares continuam proibidos pelo _lib.mjs.
  const GIT_LOCAL = [
    /^git\s+(status|diff|log|branch\s+--show-current)(\s+[^;&|><`$]+)?$/,
    /^git\s+check-ignore(\s+[^;&|><`$]+)?$/,
    /^git\s+add\s+-A$/,
    /^git\s+commit\s+-m\s+"[^"$`]+"$/,
  ];
  if (!ENCADEAMENTO.test(comando) && GIT_LOCAL.some((r) => r.test(comando)))
    process.exit(0);
  const proibido = comandoProibido(comando);
  if (proibido)
    bloquear(`o orquestrador não pode rodar este comando: ${proibido}.`);
  const permitidos = [
    ...COMANDOS_DE_TESTE,
    /^npm\s+run\s+build$/,
    /^node\s+\.claude\/hooks\/orcamento-contexto\/(check|medir)\.mjs$/,
    /^node\s+scripts\/verificar-docs\.mjs(\s+--aviso)?$/,
    /^node\s+scripts\/sync-harness\.ts(\s+--check)?$/,
    /^node\s+scripts\/gemini-assist\.mjs(\s+[^;&|><`$]+)?$/,
    // memória (rag.db): consultar, registrar nota, podar (sem encadear; aspas permitidas)
    /^node\s+\.claude\/scripts\/(search|embed|prune)\.ts(\s+[^;&|><`$]+)?$/,
  ];
  if (
    !comando ||
    ENCADEAMENTO.test(comando) ||
    !permitidos.some((r) => r.test(comando))
  ) {
    bloquear(
      `o orquestrador só roda verificações (npm run lint/typecheck/build, npm test, npx vitest/biome/tsc) e os scripts de contexto, sem encadear. Tentou: "${comando}". Para qualquer outra coisa, delegue a um agent.`,
    );
  }
  process.exit(0);
}

if (["Write", "Edit", "NotebookEdit"].includes(ferramenta)) {
  const alvo = relativo(String(params.file_path ?? params.notebook_path ?? ""));
  const permitido =
    !alvo.startsWith("..") &&
    (alvo.startsWith("docs/") ||
      ["PENDENCIAS.md", "PLAN.md", "CLAUDE.md"].includes(alvo));
  if (!permitido) {
    bloquear(
      `o orquestrador só edita docs/, PENDENCIAS.md, PLAN.md e CLAUDE.md. Tentou editar ${alvo}. Código, testes, migrações e configuração são dos agents; SPEC.md é do usuário.`,
    );
  }
}
process.exit(0);
