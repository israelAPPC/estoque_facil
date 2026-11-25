---
agent: agent-produtos
data: 2026-11-25
origem: agent
---

## bug
- `editarProduto` (servico.ts) relinha lojas desnecessariamente quando lojaIds é undefined, causando race condition; corrigido: passar null para a RPC. `salvarComLojas` (repositorio.ts) enviava p_ativo inexistente em 0004; solução: remover envio e usar a linha devolvida pela RPC.

## decisao
- **Deploy coordenado:** migration 0004 e app novo devem ir juntos; app antigo não funciona com 0004 (assinatura mudou). Versionar RPC é frágil — garantir compatibilidade simultânea é mais seguro.
- **Null = manter estado:** p_loja_ids nulo na RPC não altera vínculos. Elimina releitura e previne race conditions.

## padrao
- Mapear 22023 em repositório: com hint 'lojas_invalidas' → LojasProdutoInvalidasError ("Uma ou mais lojas..."); sem hint → mesma classe ("Marque ao menos..."); genéricos no log. TDD: testes de regressão antes do código. RPC como source of truth: usar o valor devolvido, não reler.

## nao-funcionou
- Prettier/biome bloqueou edições em estado intermediário; resolvido com prettier --write no final.

## feature
- Task 2.4 (3ª rodada): `salvarComLojas` compatível com 0004, `editarProduto` envia null sem reler, erros 22023 mapeados. Testes: 240/240 passando.
