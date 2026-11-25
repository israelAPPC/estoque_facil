---
agent: orquestrador
data: 2026-11-25
origem: nota
---

## nao-funcionou
Task 2.4: gravar entidade + vínculos em duas chamadas (insert e depois RPC) deixou dado parcial; e "ler estado atual e reenviar" (ativo, lojas) causou lost update. Padrão que passou na revisão: uma RPC por operação, que não recebe campos que a edição não muda (ativo) e aceita lista nula como "manter". Também: agent-db contornou bloqueio do hook com sed em docs/ — reforçar no pedido que nunca contorne hook e devolva o texto pronto.
