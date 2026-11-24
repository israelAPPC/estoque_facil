---
description: Revisa o código com o @code-reviewer contra SPEC.md e PLAN.md (BLOQUEANTE, IMPORTANTE, SUGESTÃO)
agent: orquestrador
---

Revisão pedida: $ARGUMENTS (vazio = o trabalho mais recente).

1. Defina o que revisar: a task/fase indicada, ou os arquivos alterados mais recentemente (use Glob ordenado por data). Identifique o módulo e o doc de docs/modulos/ correspondente.
2. Invoque o agent **code-reviewer** com: SPEC.md e PLAN.md como referência, a task ou fase, a lista de arquivos, o doc do módulo e o resultado mais recente de lint/typecheck/testes (rode `npm run lint`, `npm run typecheck` e `npm test` antes, pois o revisor não executa nada).
3. Apresente o relatório agrupado em **BLOQUEANTE**, **IMPORTANTE** e **SUGESTÃO**, com arquivo:linha. Falha de segurança é sempre BLOQUEANTE.
4. Não corrija nada. Pergunte (múltipla escolha) o próximo passo: corrigir pelo agent do módulo, investigar com /analisa-bug, ou encerrar.

Regras: siga o fluxo do orquestrador (.claude/agents/orquestrador.md); nunca faça commit, push ou deploy; pendências em PENDENCIAS.md; histórico só em docs/CHANGELOG.md, nunca no CLAUDE.md.
