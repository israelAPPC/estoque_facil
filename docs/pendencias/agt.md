# Pendências: Agents, hooks e comandos (AGT)

Texto completo dos itens abertos. Resumo e P0/P1 em PENDENCIAS.md.

<a id="agt-001"></a>
### AGT-001: Validar hooks e orquestrador como agente principal numa sessão real do Claude Code.

**P1 · VALIDAR** · origem: 2026-11-24

Os hooks (docs/hooks.md) só foram testados com entrada simulada. Validar numa sessão real: variável `$CLAUDE_PROJECT_DIR` e `Stop` no frontmatter de subagent no Windows; `"agent": "orquestrador"` em .claude/settings.json (se o hook do frontmatter roda na sessão principal, se `Agent(...)` restringe a lista de agents e se o modelo Opus é aceito). Se o orquestrador falhar, remover `"agent"` e usar `/agents`. Roteiro em docs/validacoes-banco-real.md.

<a id="agt-002"></a>
### AGT-002: Rodar a primeira task real com agents e ajustar os prompts após a primeira Fase.

**P1 · VALIDAR** · origem: 2026-11-24

Os agents nunca foram executados numa task real (nem story-validator nem code-reviewer no fluxo completo). Executar a Fase 1 do PLAN.md pelo orquestrador, observar se os hooks de escopo e de testes atrapalham ou protegem, e ajustar os prompts. Roteiro em docs/validacoes-banco-real.md.

<a id="agt-003"></a>
### AGT-003: Executar os slash commands pela primeira vez e checar colisão de /review.

**P2 · VALIDAR** · origem: 2026-11-24

Os comandos de .claude/commands/ e .opencode/commands/ nunca foram executados. `/review` pode colidir com um comando embutido do Claude Code (alternativa: `/project:review` ou renomear). No OpenCode, `default_agent` e `permission.task` do orquestrador também não foram verificados (ver HAR-002).

<a id="agt-004"></a>
### AGT-004: Confirmar com /context se subagents recebem as rules com paths: ao iniciar.

**P2 · VALIDAR** · origem: 2026-11-24

A documentação não confirma se subagents customizados recebem as rules com `paths:` no início ou só ao tocar arquivos que casam. Conferir com `/context` na primeira task real; se não receberem, citar a regra no corpo do agent.

<a id="agt-005"></a>
### AGT-005: Criar hook global de PostToolUse (lint e tipos) para a sessão principal.

**P2 · FEATURE** · origem: 2026-11-24

O hook global de PostToolUse (lint/tipos para a sessão principal) não foi criado; foi adiado da etapa 10 (rules e segurança). Hoje só os agents de módulo rodam testes após edição.

<a id="agt-006"></a>
### AGT-006: Decidir se o orquestrador continua em Opus ou passa para Sonnet por custo.

**P3 · DECISÃO** · origem: 2026-11-24

O orquestrador roda em Opus (custo maior por sessão). Se pesar, trocar `model: opus` por `sonnet` em .claude/agents/orquestrador.md (e em .opencode/agents/orquestrador.md).

<a id="agt-007"></a>
### AGT-007: Squads externos ficam fora do projeto (caminho absoluto em docs/squads.md).

**P3 · DÉBITO** · origem: 2026-11-24

Os squads usados pelo consultor-squad estão em C:/Users/israe/OneDrive/Desktop/Projetos Israel/Sistemas/criador_site/squads, fora do projeto; o caminho é absoluto e não funciona em outra máquina. Decidir se copia o necessário para o projeto.

