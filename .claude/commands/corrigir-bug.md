---
description: Aplica o plano do /analisa-bug via agents responsáveis; registra no CHANGELOG e o aprendizado no rag.db
argument-hint: "[plano do /analisa-bug]"
---

Plano de correção: $ARGUMENTS

1. Se o plano não vier no pedido, use o relatório do /analisa-bug mais recente da conversa; se não houver, pergunte.
2. Delegue ao agent responsável: **primeiro o teste de regressão que falha**, depois a correção mínima (sem refatorar o que não é do bug).
3. Valide: story-validator e code-reviewer (BLOQUEANTE volta ao agent). Rode lint, typecheck e testes.
4. Registre a correção em **docs/CHANGELOG.md** (nunca no CLAUDE.md) e, se a regra do módulo mudou, em docs/modulos/<módulo>.md.
5. Registre o aprendizado no rag.db: `node .claude/scripts/embed.ts --nota "<sintoma, causa raiz e correção, com arquivos>" --categoria bug --agent <agent responsável>` (use `--categoria nao-funcionou` para tentativas que falharam). Sem segredos nem dados pessoais.
6. Reporte o que foi corrigido e verificado.

Regras: siga o fluxo do orquestrador (.claude/agents/orquestrador.md); nunca faça commit, push ou deploy; pendências em PENDENCIAS.md; histórico só em docs/CHANGELOG.md, nunca no CLAUDE.md.
