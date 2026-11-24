---
description: Investiga a causa raiz de um bug e entrega relatório com solução proposta; sugere /corrigir-bug
agent: orquestrador
---

Bug: $ARGUMENTS

Se a descrição for vaga, pergunte (múltipla escolha) o que falta: onde ocorre, passos para reproduzir, esperado x obtido.

1. Identifique o módulo e leia o doc de docs/modulos/ dele e a skill/regra de negócio relacionada.
2. Consulte a memória: `node .claude/scripts/search.ts "<sintoma>"` (bugs parecidos já resolvidos). Depois investigue sem alterar nada: leia o código e os testes (você mesmo, ou delegando a leitura ao **code-reviewer**; se a dúvida for de especialista, ao **consultor-squad**). Rode os testes existentes se ajudar.
3. Entregue o relatório:
   - Sintoma e como reproduzir
   - **Causa raiz** (arquivo:linha) e por que os testes não pegaram
   - Impacto (saldos ou dados já gravados incorretamente? segurança?)
   - Solução proposta, agent responsável e modelo
   - Teste de regressão que deve ser escrito ANTES da correção
   - Riscos e alternativas
4. Termine sugerindo: "Para aplicar, use /corrigir-bug com este plano."

Regras: siga o fluxo do orquestrador (.claude/agents/orquestrador.md); nunca faça commit, push ou deploy; pendências em PENDENCIAS.md; histórico só em docs/CHANGELOG.md, nunca no CLAUDE.md.
