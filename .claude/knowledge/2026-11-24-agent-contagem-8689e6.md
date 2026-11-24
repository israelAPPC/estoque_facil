---
agent: agent-contagem
data: 2026-11-24
origem: agent
---

## bug
- Validações de `produtoId` duplicado e quantidade inválida não existiam em `comparar.ts`; implementadas com lançamento de `ProdutoDuplicadoError` e reuso de `QuantidadeInvalidaError`, rodando antes de qualquer comparação.

## decisao
- Duplicados em contagem: rejeitar com erro tipado, nunca deduplicar (decisão do orquestrador).
- `QuantidadeInvalidaError` é reutilizado de `produtos/unidades.ts` em vez de criar novo erro com mesmo nome.

## padrao
- Ordem de saída em `comparar.ts`: comparados na ordem de `atual`, depois omitidos na ordem de `anterior`.
- Validação de quantidade rejeita NaN, Infinity, não inteiro seguro, negativo e acima de `MAX_SAFE_INTEGER`.
- Testes de imutabilidade usam cópia profunda para validar que `anterior` não é alterada.

## nao-funcionou
- Hook `testes-modulo.mjs` falha com "reading 'config'" em execução concorrente do Vitest, mesmo com código correto; contorna rodando `npx vitest run tests/modules/contagem` manualmente. Erro de ambiente investigado por outro agent.
