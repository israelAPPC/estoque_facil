# Módulo Produtos

Fonte: SPEC.md (seção Produtos). Cadastro de produtos, categoria, SKU, estoque mínimo e fator caixa→unidade; conversão caixa/unidade.

## Regras
- Produto tem nome, código/SKU, categoria, estoque mínimo e fator caixa→unidade.
- SKU único e normalizado (trim, sem diferença de maiúscula).
- Produto sem caixa tem fator 1; produto controlado por caixa exige fator maior que 0.
- Estoque mínimo negativo é rejeitado.
- Quantidade é sempre gravada na menor unidade; caixa/unidade só na exibição.
- Produto é desativado, nunca excluído (decisão do usuário, 2026-11-24).
- SKU duplicado: "Já existe um produto com este código (SKU)."; erro cru do banco nunca chega à tela.
- Produto por loja (decisão do usuário, 2026-11-24; a implementar na Task 2.4): no cadastro, checkboxes marcam as lojas onde o produto existe; produto novo vem com todas marcadas; só aparece nas lojas marcadas em contagem, requisição e estoque.

## Estado atual
- Implementado: conversão (Task 1.2); cadastro completo (Task 2.3): regras, serviço, repositório, páginas e ações.
- Fora de escopo por ora: escolha de lojas por produto (etapa futura).

## Cadastro (Task 2.3)
- `regras.ts`: `esquemaProduto` (zod), `validarProduto`; erros tipados `EntradaProdutoInvalidaError` (mensagens por campo), `SkuDuplicadoError`, `ProdutoErroDesconhecidoError`, `ProdutoNaoEncontradoError` ("Produto não encontrado."). Fator padrão 1 (inteiro >= 1); estoque mínimo inteiro >= 0 em unidades; SKU com trim.
- `servico.ts`: `criarProduto`, `editarProduto`, `alterarAtivo`, `listarProdutos` (página mínima 1, limite máximo 100, padrão 20) sobre a interface `RepositorioProdutos`; `editarProduto` e `alterarAtivo` validam id (`z.string().uuid()`) e ativo (`z.boolean()`) e lançam `EntradaProdutoInvalidaError` se inválidos.
- `repositorio.ts`: único arquivo com Supabase; `criarRepositorioProdutos(cliente)` recebe o cliente por parâmetro (padrão de lojas); mapeia linha para domínio; código 23505 vira `SkuDuplicadoError` e PGRST116 (id inexistente no `.single()`) vira `ProdutoNaoEncontradoError` (ambos testados com cliente falso); demais erros viram erro genérico (detalhe só no log); `obterProduto(id)` faz parte da interface `RepositorioProdutos` e é exposto pelo serviço (a página de edição usa o serviço). Falha ao desativar/reativar aparece na tela com mensagem genérica.
- `src/app/(app)/produtos/actions.ts`: `salvarProdutoAction` (criar/editar) e `alterarAtivoAction`; exigem `obterUsuario()`, validam id (uuid) e flag com zod, SKU duplicado vai ao campo `sku`, demais falhas viram mensagem genérica.
- Páginas: listagem paginada, `novo`, `[id]` (editar) e botão desativar/reativar com confirmação.
- Testes: `tests/modules/produtos/servico.test.ts`.

## Conversão (`src/modules/produtos/unidades.ts`)
Funções puras, sem Supabase. Único lugar onde existe conta de caixa.

- `paraUnidades(caixas, unidades, fator): number` = `caixas * fator + unidades`. Exemplo: 3 cx + 10 un, fator 24 = 82.
- `paraCaixas(total, fator): { caixas, unidades }` com `caixas = floor(total / fator)` e `unidades = total % fator`. Exemplo: 82, fator 24 = 3 cx + 10 un.
- `FatorInvalidoError`: fator zero, negativo, não inteiro, NaN ou Infinity.
- `QuantidadeInvalidaError`: caixas, unidades ou total negativos, não inteiros, NaN ou Infinity.

Testes: `tests/modules/produtos/unidades.test.ts`.
