---
description: Planeja e implementa uma melhoria via agents; atualiza o doc do módulo e o CHANGELOG
argument-hint: "[descrição da melhoria]"
---

Melhoria: $ARGUMENTS

1. Identifique os módulos afetados e leia só os docs de docs/modulos/ deles; confira docs/decisoes-em-aberto.md.
2. Faça perguntas de clarificação em múltipla escolha, se houver ambiguidade.
3. Monte o plano (agents, modelo, skills, doc a ler, mapa de paralelismo, critérios de aceite, testes) e aguarde aprovação. Se mudar a arquitetura, proponha ADR em docs/adr/.
4. Delegue com TDD; valide com story-validator e code-reviewer; rode lint, typecheck e testes.
5. Garanta a atualização de docs/modulos/<módulo>.md e docs/CHANGELOG.md; pendências em PENDENCIAS.md.
6. Reporte o resultado.

Regras: siga o fluxo do orquestrador (.claude/agents/orquestrador.md); nunca faça commit, push ou deploy; pendências em PENDENCIAS.md; histórico só em docs/CHANGELOG.md, nunca no CLAUDE.md.
