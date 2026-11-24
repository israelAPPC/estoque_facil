---
agent: mcp
data: 2026-11-24
origem: nota
---

## bug
2026-11-24: o hook .claude/hooks/orquestrador/guarda.mjs aplicava as restrições do orquestrador também aos subagents (bloqueou escrita em tests/ e src/ do agent-produtos, estoque e contagem). Precisa distinguir o agente ativo; correção feita pelo usuário.
