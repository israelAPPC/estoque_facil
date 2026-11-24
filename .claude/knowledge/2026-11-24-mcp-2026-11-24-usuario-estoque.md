---
agent: mcp
data: 2026-11-24
origem: nota
---

## decisao
2026-11-24 (usuário): estoque_atual só leitura para authenticated, saldo muda só via função SQL transacional; contagem editável apenas em status rascunho, confirmada imutável; lojas e produtos desativam via coluna ativo, sem exclusão física; manter/zerar itens omitidos é escolha única por contagem; contagens e movimentos usam timestamp. Substitui a sugestão anterior de "data igual não entra".
