# Módulo Estoque

Consulta do estoque atual, geral (todas as lojas) e por loja, exibida em caixas + unidades.

## Regras (SPEC)
- Quantidade guardada na menor unidade; caixa/unidade só na exibição (`paraCaixas`, de `produtos/unidades.ts`).
- Saldo = contagem-base + movimentos posteriores à contagem. Movimento anterior à base não entra no saldo (fica no histórico).
- Requisição retroativa recalcula o saldo a partir da contagem.
- Saldo negativo não é erro: a interface avisa e permite.

## Estado atual
- `src/modules/estoque/saldo.ts`: `calcularSaldo(base | null, movimentos)`, função pura.
  - `data` é timestamp ISO 8601 com hora e fuso (decisão de 2026-11-24).
  - Entra só movimento com instante ESTRITAMENTE posterior ao da base (igual não entra); comparação por `Date.parse`, não por string.
  - Data fora do formato (inclusive sem fuso) lança `DataInvalidaError`.
  - Sem base, soma todos os movimentos. Não muta as entradas.
  - `base.quantidade` deve ser inteiro seguro >= 0 e `delta` inteiro seguro (pode ser negativo); senão lança `QuantidadeInvalidaError` (`campo` = "base" ou "delta"). Todos os movimentos são validados, inclusive os anteriores à base.
  - Dia inexistente (ex.: 2026-02-30) lança `DataInvalidaError`. A comparação trunca a milissegundos.
- Testes: `tests/modules/estoque/saldo.test.ts`.
- Telas de consulta (geral e por loja): ainda não implementadas.
