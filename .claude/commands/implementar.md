---
description: Implementa uma task do PLAN.md: delega ao agent certo, exige TDD e dispara o @code-reviewer ao final
argument-hint: "[id ou título da task, ex.: 1.2]"
---

Task pedida: $ARGUMENTS

1. Leia a task no PLAN.md (Agent, Input, Output, Testes críticos). Se não achar, liste as tasks abertas e pergunte qual (múltipla escolha). Confira as dependências da fase e docs/decisoes-em-aberto.md; se algo bloquear, pare e pergunte.
2. Mostre o mini-plano: agent, modelo, skills, doc de docs/modulos/ a ler, pasta de trabalho e se roda em paralelo com outras tasks da fase. Aguarde aprovação.
3. Delegue ao agent do módulo exigindo **TDD**: teste escrito e visto falhar antes do código, e evidência do resultado ao final.
4. Quando ele devolver, chame o **story-validator** (máx. 3 rodadas; reprovou volta ao agent).
5. Aprovado, dispare o **code-reviewer** automaticamente. BLOQUEANTE e IMPORTANTE voltam ao agent do módulo; repita até não haver bloqueantes (máx. 3 ciclos; depois escale).
6. Rode lint, typecheck, testes (e build se mexeu em rota). Confira que o doc do módulo, docs/CHANGELOG.md e PENDENCIAS.md foram atualizados. Marque os checkboxes da task no PLAN.md.
7. Reporte: o que foi feito, verificado, pendências e decisões do usuário.

Regras: siga o fluxo do orquestrador (.claude/agents/orquestrador.md); nunca faça commit, push ou deploy; pendências em PENDENCIAS.md; histórico só em docs/CHANGELOG.md, nunca no CLAUDE.md.
