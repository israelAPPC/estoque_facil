---
description: Planeja uma feature em sprints/fases/tasks com TDD e gera documentação técnica e de uso
argument-hint: "[descrição da feature]"
---

Feature: $ARGUMENTS

1. **Clarifique** com perguntas de múltipla escolha (objetivo, quem usa, regras, o que fica fora, decisões em aberto relacionadas). Não invente regra de negócio.
2. **Monte o plano** no mesmo formato do PLAN.md: Sprint → Fases → Tasks, cada task com Agent, Input, Output (arquivos) e Testes críticos como critérios de aceite; **TDD obrigatório**; indique dependências e mapa de paralelismo. Se a feature for um módulo novo sem agent, proponha criar o agent (decisão do usuário). Apresente e aguarde aprovação antes de gravar.
3. Aprovado, acrescente o plano ao PLAN.md (sem alterar o que existe) e execute as tasks pelo fluxo do /implementar.
4. **Ao final, gere 2 documentos em docs/**:
   - Técnico: **docs/modulos/<módulo>.md** (criar ou atualizar): regras, estrutura, decisões, testes. Inclua/atualize a linha do módulo no "Índice de módulos" do CLAUDE.md (uma linha).
   - De uso: **docs/uso/<feature>.md**: passo a passo para o usuário final, em português simples, sem jargão.
5. Atualize docs/CHANGELOG.md e PENDENCIAS.md; reporte.

Regras: siga o fluxo do orquestrador (.claude/agents/orquestrador.md); nunca faça commit, push ou deploy; pendências em PENDENCIAS.md; histórico só em docs/CHANGELOG.md, nunca no CLAUDE.md.
