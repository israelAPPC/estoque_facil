---
description: Fecha o projeto/fase: hooks de encerramento, checkboxes do PLAN.md, auditoria de contexto e relatório de próximos passos
---

Verificação de entrega.

1. Rode os hooks de encerramento: `node .claude/hooks/orcamento-contexto/check.mjs` e as verificações `npm run lint`, `npm run typecheck`, `npm test` e `npm run build`. Reporte o resultado real de cada um.
2. Leia o PLAN.md e liste os checkboxes ainda abertos por Sprint/Fase/Task. Leia PENDENCIAS.md e docs/decisoes-em-aberto.md.
3. Rode `node scripts/sync-harness.ts` (sincroniza .agents/, .opencode/ e .gemini/ com .claude/; trate ORFÃO) e `node scripts/sync-harness.ts --check` (deve dar 0 divergências). Rode `node scripts/verificar-docs.mjs` (caminhos citados, IDs do PLAN nas pendências, Resumo do PENDENCIAS.md, catálogo do orquestrador, orçamentos) e trate cada ERRO. Confira que docs/modulos/ e docs/CHANGELOG.md refletem o que foi entregue.
4. Faça a checagem do /auditar-contexto (rode `node .claude/hooks/orcamento-contexto/medir.mjs` e relate só o que estourou o orçamento ou tem histórico datado no CLAUDE.md; sem aplicar nada).
5. Gere o relatório de próximos passos: o que falta, riscos, pendências priorizadas e o que depende de decisão do usuário.
6. Só confirme "projeto pronto" se tudo acima estiver verde e sem checkbox crítico aberto; caso contrário, diga objetivamente o que impede.

Regras: siga o fluxo do orquestrador (.claude/agents/orquestrador.md); nunca faça commit, push ou deploy; pendências em PENDENCIAS.md; histórico só em docs/CHANGELOG.md, nunca no CLAUDE.md.
