# Módulo Contagem

Fonte: SPEC.md (Contagem de estoque).

## Regras
- Lançada por loja e data; nasce como rascunho e não mexe no estoque.
- Ao confirmar (transação única), `estoque_atual` da loja passa a ser o valor contado; contagens antigas nunca são alteradas.
- Sempre comparada com a contagem anterior da mesma loja. Sem anterior, a diferença é "inicial".
- Quantidades na menor unidade; caixa/unidade só na exibição.
- Itens omitidos (decisão de 2026-11-24): aparecem como "omitido", sem delta, até o usuário escolher manter ou zerar; a escolha é única por contagem e é tratada na Task 3.1.

- Contagem inicial (decisão de 2026-11-24): só a função de importação marca `inicial = true`. O usuário logado não grava `inicial = true` em contagens (insert nem update), imposto por RLS with check. Apagar rascunho: apagar os itens antes (FK restrict).

## Estado atual
- `src/modules/contagem/comparar.ts`: `compararContagens(atual, anterior)` (pura) devolve `Diferenca[]` com `produtoId`, `anterior`, `atual`, `delta` e `situacao` (`inicial` | `comparado` | `omitido`).
  - anterior null: tudo `inicial` (anterior e delta null).
  - produto novo: anterior 0, delta = atual.
  - produto só na anterior: `omitido` (atual e delta null).
  - ordem: itens da contagem atual (na ordem de `atual`), depois os omitidos (na ordem de `anterior`).
  - anterior `[]` (não nula): tudo `comparado` com anterior 0; atual `[]` com anterior preenchida: tudo `omitido`.
  - validação (decisão do orquestrador: rejeitar, não deduplicar): `produtoId` repetido em `atual` ou `anterior` lança `ProdutoDuplicadoError`; quantidade não inteira segura ou negativa lança `QuantidadeInvalidaError` (reexportada de `produtos/unidades`). Zero é válido.
  - não altera as entradas (testado com cópia profunda da `anterior`).
- Testes: `tests/modules/contagem/comparar.test.ts`.

## Pendente
- Rascunho, confirmação, histórico e telas (Fase 3).
