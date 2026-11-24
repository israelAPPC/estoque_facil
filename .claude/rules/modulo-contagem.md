---
paths:
  - "src/modules/contagem/**"
  - "src/app/contagem/**"
  - "tests/modules/contagem/**"
---

# Módulo contagem

Leia docs/modulos/contagem.md. Regras gerais na skill regras-estoque.

- Rascunho não altera `estoque_atual`; só a confirmação (transação) altera.
- Confirmar nunca altera nem apaga contagem antiga; grava nova contagem e atualiza o saldo.
- Comparar sempre com a última contagem confirmada da mesma loja; sem anterior, marcar "inicial".
- Item omitido: manter ou zerar (escolha do usuário na hora; escopo final é decisão em aberto).
- Confirmar duas vezes o mesmo rascunho não pode duplicar: idempotente.
- Contagem com data futura é rejeitada.
- Importação de estoque inicial reutiliza `confirmarContagem`; não criar segundo caminho.
