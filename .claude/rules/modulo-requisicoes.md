---
paths:
  - "src/modules/requisicoes/**"
  - "src/app/requisicoes/**"
  - "tests/modules/requisicoes/**"
---

# Módulo requisições

Leia docs/modulos/requisicoes.md. Regras gerais na skill regras-estoque.

- Duas ações: consumo (baixa só a loja informada) e transferência (origem baixa, destino soma, mesma transação).
- Transferência com origem igual ao destino é rejeitada.
- Quantidade zero ou negativa é rejeitada; saldo negativo avisa e só grava com confirmação explícita (nunca bloquear).
- Movimento com data anterior à contagem-base fica no histórico, mas não entra no saldo.
- Requisição é imutável; correção é novo lançamento de ajuste. Desfazer/editar transferência é decisão em aberto: não implementar.
- Registrar quem lançou e a data informada, separada da data de criação.
