# Harnesses (Claude Code, OpenCode, Gemini CLI, Antigravity)

**Fonte única**: `.claude/` (rules, skills, agents), `CLAUDE.md`, `docs/` e `rag.db`. Os outros harnesses são GERADOS por `node scripts/sync-harness.ts` (grava só o que mudou; `--check` não grava e lista divergências). Roda no hook de Stop e no `/entrega`.

| Harness | O que lê | Gerado a partir de |
|---|---|---|
| Claude Code | CLAUDE.md, .claude/ | (fonte) |
| Antigravity | GEMINI.md, `.agents/rules` (trigger always_on ou glob), `.agents/skills`, `.agents/agents`, `.agents/hooks.json` | .claude/rules, skills, agents; índice do GEMINI.md vem do CLAUDE.md |
| Gemini CLI | GEMINI.md, `.gemini/agents` | idem |
| OpenCode | opencode.json, `.opencode/agents` (o orquestrador é mantido à mão), `.opencode/instrucoes`, `.opencode/commands` | .claude/agents e rules |

Formatos conferidos na documentação do Antigravity (antigravity.google/docs: rules, skills, subagents, hooks, mcp, customization-discovery): `AGENTS.md` e `GEMINI.md` são lidos sempre; rules em `.agents/rules/*.md` exigem frontmatter `trigger` (`always_on`, `glob` com `globs`, `model_decision`, `manual`), senão são descartadas; skills em `.agents/skills/<nome>/SKILL.md`; agents em `.agents/agents/<nome>.md` (`name`, `description`, `tools`, `model` inherit/flash/pro, `mainAgent`, `skills`); hooks em `.agents/hooks.json` (entrada e saída JSON, decisão `allow`/`deny`); MCP em `.agents/mcp_config.json`. Orçamento: 24 KB por rule e 20k tokens para as always_on.

## Regras de sincronização
- Rule, agent ou skill nova ou alterada: edite em `.claude/`, rode o sync. Nunca edite `.agents/`, `.gemini/agents` nem `.opencode/agents` direto (exceto `.opencode/agents/orquestrador.md`).
- Não há sincronização no sentido inverso: o que o Gemini/Antigravity criar direto nessas pastas aparece como ORFÃO ou DIVERGE e deve ser promovido à mão para `.claude/`. Isso evita sobrescrever trabalho em silêncio.
- Conhecimento (bugs, features, decisões) é compartilhado por `rag.db` (`search.ts`, `embed.ts --nota`) e `docs/CHANGELOG.md`. No Claude os hooks fazem isso sozinhos; no Gemini/Antigravity o GEMINI.md manda fazer à mão (pendência HAR-004).
- Proteções: `.agents/hooks.json` chama `scripts/antigravity-hook.mjs`, que reaproveita `.claude/hooks/_lib.mjs` (bloqueia git push/commit, rm -rf, deploy, `.env`, e edição de SPEC/PLAN/CLAUDE.md, .claude/, package.json). É só proteção global; o escopo por agent não existe no Antigravity (HAR-004).
- O gerador antigo de agents (fora do projeto) foi substituído por este script; `.claude/agents/` passou a ser editado à mão.
