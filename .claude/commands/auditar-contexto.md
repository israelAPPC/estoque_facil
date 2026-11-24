---
description: Mede CLAUDE.md, rules e docs/modulos e propõe o que mover (só propõe; aplica após aprovação)
---

Auditoria de contexto.

1. Rode `node .claude/hooks/orcamento-contexto/medir.mjs`. Ele mede o CLAUDE.md (por seção), as rules (incondicionais e com paths) e os docs/modulos/, e aponta possível histórico datado.
2. Compare com o orçamento: CLAUDE.md ~10 KB; rules incondicionais ~3k tokens somadas; cada rule até 30 linhas. Aponte as seções que passaram.
3. Leia o CLAUDE.md e confirme o que é histórico datado (datas, versões, "corrigido em..."), detalhe de módulo ou lista longa.
4. **Proponha** (tabela: trecho | tamanho | destino | motivo) o que mover para docs/modulos/<módulo>.md, docs/CHANGELOG.md, rag.db (se existir) ou rule com paths. **Mover, nunca descartar.**
5. **Não aplique nada** sem a aprovação do usuário. Pergunte em múltipla escolha: aplicar tudo, aplicar parte ou nada. Ao aplicar, mova o texto (sem perder conteúdo), mantenha o índice de módulos do CLAUDE.md e rode o medir de novo para mostrar o antes e o depois.

Regras: siga o fluxo do orquestrador (.claude/agents/orquestrador.md); nunca faça commit, push ou deploy; pendências em PENDENCIAS.md; histórico só em docs/CHANGELOG.md, nunca no CLAUDE.md.
