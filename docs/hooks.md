# Hooks

Scripts em Node (`.mjs`), sem dependências, em `.claude/hooks/`. Regra: `exit 2` bloqueia (a mensagem vai para o agent); `exit 0` permite. Configurados no frontmatter de cada agent em `.claude/agents/`.

| Tipo de agent | Quais | Hooks |
|---|---|---|
| Implementação | os 10 `agent-*` | **PreToolUse** (`implementacao/guarda-escopo.mjs`): bloqueia comandos proibidos e edição fora da pasta do módulo (lida de `.claude/hooks/<agent>/config.json`). **PostToolUse** (`testes-modulo.mjs ... post`): ao editar `src/`, roda os testes do módulo e devolve a falha. **Stop** (`testes-modulo.mjs ... stop`): não deixa encerrar com teste falhando. |
| Somente leitura | story-validator, consultor-squad | **PreToolUse** (`somente-leitura/bloquear.mjs`): bloqueia Write, Edit e Bash. |
| QA / revisão | code-reviewer | Write/Edit bloqueados; Bash só passa por `qa-testes/somente-testes.mjs` (npm test, lint, typecheck, vitest, biome check, tsc --noEmit, sem encadear comandos). |
| Global (todas as sessões) | `.claude/settings.json` | **Stop** `orcamento-contexto/check.mjs`: avisa se CLAUDE.md passar de ~12 KB ou as rules sem `paths:` somarem mais de ~12 KB (~3k tokens). Só avisa. |

## Bloqueado para qualquer agent de implementação
- Comandos: `git push/commit/reset/clean/rebase/merge`, `rm -rf` e similares, `vercel`/`npm publish`, `supabase db push/reset/link`, baixar e executar script, qualquer comando que cite `.env` (exceto `.env.example`), `npm install <pacote>` (pacote novo exige decisão do usuário).
- Arquivos: SPEC.md, PLAN.md, CLAUDE.md, `.env*`, `.claude/`, `.opencode/`, `.gemini/`, package.json e package-lock.json.
- Pastas fora do escopo do agent (ex.: agent-produtos não edita `src/modules/contagem/`).

## Ajustar o escopo de um agent
Edite `.claude/hooks/<agent>/config.json` (`pastasPermitidas`, `testes`). Sempre liberados: `docs/CHANGELOG.md`, `PENDENCIAS.md`, `docs/decisoes-em-aberto.md` e `docs/modulos/<modulo>.md`.

## Gerador
Os agents e as configs são gerados por script; se mudar um agent, edite o `.md` em `.claude/agents/` e replique em `.opencode/agents/` e `.gemini/agents/`.

## OpenCode
`.opencode/plugin/agent-hooks.ts`: o OpenCode não diz qual agent chamou a ferramenta, então o plugin aplica só as proteções globais (comandos proibidos, arquivos protegidos, testes após editar `src/`). Escopo por pasta e somente leitura ficam nos `tools:` de cada agent.

## Gemini / Antigravity
Sem hooks por agent. Dependem dos `tools:` do frontmatter e das regras escritas nos prompts.

## Limites conhecidos
- Hooks bloqueiam comandos óbvios, não são uma sandbox: um comando disfarçado (ex.: script que chama git) pode passar. A defesa real continua sendo não commitar/publicar sem você.
- Testados com entradas simuladas; ainda não vistos rodando dentro de uma sessão real de subagent.

## Orquestrador e code-reviewer (etapas 11 e 12)

- **code-reviewer**: só Read, Grep, Glob. Hook `somente-leitura/bloquear.mjs` bloqueia Write, Edit, NotebookEdit e Bash (antes liberava lint/testes; agora quem roda é o orquestrador e informa o resultado).
- **orquestrador**: hook `orquestrador/guarda.mjs`. Write/Edit só em docs/, PENDENCIAS.md, PLAN.md, CLAUDE.md. Bash só `npm test`, `npm run lint|typecheck|build`, `npx vitest|biome check|tsc --noEmit` e `node .claude/hooks/orcamento-contexto/(check|medir).mjs`, sem encadear; comandos proibidos (git push/commit, rm -rf, deploy etc.) continuam bloqueados.
- Orçamento do CLAUDE.md passou de ~12 KB para ~10 KB (`orcamento-contexto/limites.mjs`).

## Verificador de documentação (etapa 24)

`node scripts/verificar-docs.mjs` (somente leitura; exit 1 se houver ERRO) confere: caminhos `docs/` e `.claude/` citados existem; IDs do PLAN existem nas pendências; exceções de escrita idênticas (só se existir docs/seguranca-excecoes-escrita.md, hoje não se aplica); índice de módulos do CLAUDE.md x tabela do SPEC.md; orçamentos (CLAUDE.md e SPEC.md ~10 KB, rules incondicionais ~12 KB, PENDENCIAS.md ~25 KB) e títulos truncados; Resumo do PENDENCIAS.md x corpo, IDs únicos e presentes no detalhe; todo agent no catálogo do orquestrador; nome do produto no CLAUDE.md. Docs de módulo e saídas de agents ainda não criados viram AVISO, não ERRO. Roda no `/entrega` e, com `--aviso`, no hook de Stop (`orcamento-contexto/check.mjs`, sempre exit 0).
