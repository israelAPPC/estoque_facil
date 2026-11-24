---
agent: agent-produtos
data: 2026-11-24
origem: agent
---

## bug
- Ao atualizar um produto com id inexistente, o repositório retorna erro genérico (PGRST116). Criado erro tipado `ProdutoNaoEncontradoError` em `src/modules/produtos/repositorio.ts` capturando o código do Supabase no `.single()`. As actions em `src/app/(app)/produtos/actions.ts` capturam esse erro e mostram "Produto não encontrado." na tela.

## decisao
- Validação de entrada (id e ativo) ocorre no serviço `src/modules/produtos/servico.ts` lançando `EntradaProdutoInvalidaError`, mantendo o padrão já usado no módulo de produtos (diferente de lojas que retorna resultado de falha).
- Erros tipados no repositório servem para distinguir cenários específicos (recurso não encontrado vs. falha genérica).

## padrao
- TDD: escrever testes primeiro, deixar falhar, depois implementar.
- Validação em dois níveis: actions (interface/entrada) e serviço (regra de negócio).

## nao-funcionou
- Importes intermediárias de `validarId` causaram avisos do hook; resolvido rodando lint, tipos e testes novamente após conclusão.

## feature
- Validação de entrada (`editarProduto` e `alterarAtivo`) e erro tipado `ProdutoNaoEncontradoError` em `src/modules/produtos/servico.ts`, `repositorio.ts` e `actions.ts`, com testes em `tests/modules/produtos/servico.test.ts` e `repositorio.test.ts`. Verificado: 54 testes passando, sem erros de tipo ou lint.
