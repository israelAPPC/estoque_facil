---
description: Mostra as pendências abertas (Resumo e P0/P1; ou filtra por módulo, prioridade ou ID)
agent: orquestrador
---

Mostre as pendências abertas. Argumento: $ARGUMENTS

- Sem argumento: leia só a seção "Resumo" e "P0 e P1 por módulo" de PENDENCIAS.md e apresente (contagens e itens P0/P1).
- Com um módulo (ex.: `agt`, `seg`, `rag`): leia só docs/pendencias/<módulo>.md.
- Com prioridade (ex.: `P0`, `P1`): use Grep em PENDENCIAS.md e docs/pendencias/ por essa prioridade e liste os itens.
- Com um ID (ex.: `AGT-001`): leia só a seção do ID (Grep no arquivo do módulo e leitura por intervalo de linhas).

Nunca leia o PENDENCIAS.md inteiro nem todos os arquivos de detalhe sem necessidade. Só leitura: para criar ou resolver itens, siga .claude/rules/pendencias.md.
