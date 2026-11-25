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
- Produto por loja (Task 2.4): concluída no app; checkboxes de lojas no cadastro e `listarProdutosPorLoja` prontos. Telas de contagem, requisição e estoque devem usá-lo (PRO-001).

## Cadastro (Task 2.3)
- `regras.ts`: `esquemaProduto` (zod), `validarProduto`; erros tipados `EntradaProdutoInvalidaError` (mensagens por campo), `SkuDuplicadoError`, `ProdutoErroDesconhecidoError`, `ProdutoNaoEncontradoError` ("Produto não encontrado."). Fator padrão 1 (inteiro >= 1); estoque mínimo inteiro >= 0 em unidades; SKU com trim.
- `servico.ts`: `criarProduto`, `editarProduto`, `alterarAtivo`, `listarProdutos` (página mínima 1, limite máximo 100, padrão 20) sobre a interface `RepositorioProdutos`; `editarProduto` e `alterarAtivo` validam id (`z.string().uuid()`) e ativo (`z.boolean()`) e lançam `EntradaProdutoInvalidaError` se inválidos.
- `repositorio.ts`: único arquivo com Supabase; `criarRepositorioProdutos(cliente)` recebe o cliente por parâmetro (padrão de lojas); mapeia linha para domínio; código 23505 vira `SkuDuplicadoError` e PGRST116 (id inexistente no `.single()`) vira `ProdutoNaoEncontradoError` (ambos testados com cliente falso); demais erros viram erro genérico (detalhe só no log); `obterProduto(id)` faz parte da interface `RepositorioProdutos` e é exposto pelo serviço (a página de edição usa o serviço). Falha ao desativar/reativar aparece na tela com mensagem genérica.
- `src/app/(app)/produtos/actions.ts`: `salvarProdutoAction` (criar/editar) e `alterarAtivoAction`; exigem `obterUsuario()`, validam id (uuid) e flag com zod, SKU duplicado vai ao campo `sku`, demais falhas viram mensagem genérica.
- Páginas: listagem paginada, `novo`, `[id]` (editar) e botão desativar/reativar com confirmação.
- Testes: `tests/modules/produtos/servico.test.ts`.

## Produto por loja no app (Task 2.4)
- Regra pura (`regras.ts`): `validarLojasProduto` exige ao menos uma loja, ids uuid, sem repetição; erro tipado `LojasProdutoInvalidasError` ("Marque ao menos uma loja para o produto.").
- Serviço: `criarProduto(repo, entrada, lojaIds?)` valida e chama `repo.criarComLojas` (uma RPC); sem `lojaIds`, usa todas as lojas ativas. `editarProduto(..., lojaIds?)` chama `repo.salvarComLojas` (uma RPC) e substitui o conjunto (desmarcar loja ativa remove o vínculo); sem `lojaIds`, reenvia as lojas atuais. Validação ocorre antes de qualquer chamada ao banco.
- Leitura: `listarLojasAtivas`, `obterLojasDoProduto` (pré-marcar) e `listarProdutosPorLoja(repo, lojaId, { pagina })` (paginado, só vinculados, usa join `produto_lojas!inner`).
- Atomicidade: criar e editar são uma única RPC (`criar_produto_com_lojas` / `salvar_produto_com_lojas`), sem estado parcial. O repositório envia fator, mínimo e ativo sempre explícitos (as RPCs não aplicam defaults); na edição lê o `ativo` atual e o reenvia. Erros: 23505 vira `SkuDuplicadoError`; P0002 (e PGRST116) vira `ProdutoNaoEncontradoError`; demais (22023, 23514, 23503, 23502) viram `ProdutoErroDesconhecidoError` com mensagem genérica, detalhe só no log. O repositório não usa mais `definir_lojas_produto` (a RPC segue no banco).
- Formulário: checkboxes de lojas ativas (novo: todas marcadas; edição: as vinculadas), erro ligado ao grupo. Testes: `tests/modules/produtos/lojas-produto.test.ts`.

## Banco: produto por loja (Task 2.4, migração 0002)
- Tabela `public.produto_lojas`: `produto_id uuid` (FK produtos, restrict), `loja_id uuid` (FK lojas, restrict), `criado_em timestamptz default now()`; PK `(produto_id, loja_id)`; índice `produto_lojas_loja_idx` em `loja_id`.
- RLS: só `authenticated`, com select, insert e delete (sem update); nada para anon.
- Backfill na migração: todo produto existente ligado a todas as lojas ativas.
- Trigger `lojas_vincular_produtos` (AFTER INSERT em lojas): loja criada ativa recebe todos os produtos ativos. Não há trigger em produtos: produto novo com todas as lojas marcadas é responsabilidade do app.
- RPC `public.definir_lojas_produto(p_produto_id uuid, p_loja_ids uuid[]) returns void`, security invoker: numa transação trava o produto, apaga os vínculos fora da lista (desde a 0003, só de lojas ativas) e insere os da lista (sem duplicar). Erros: lista vazia ou nula `22023`; produto inexistente `P0002`; loja inexistente `23503` (FK). Executável só por `authenticated`.
- Migração 0003 (ajustes):
  - `public.criar_produto_com_lojas(p_sku text, p_nome text, p_categoria text, p_fator_caixa integer, p_estoque_minimo_unidades integer, p_ativo boolean, p_loja_ids uuid[]) returns uuid`: insere produto e vínculos na mesma transação e devolve o id.
  - `public.salvar_produto_com_lojas(p_produto_id uuid, p_sku text, p_nome text, p_categoria text, p_fator_caixa integer, p_estoque_minimo_unidades integer, p_ativo boolean, p_loja_ids uuid[]) returns void`: trava o produto (for update), atualiza os campos e substitui os vínculos.
  - Ambas security invoker, `search_path = ''`, execute só para `authenticated`. Erros: lista vazia ou nula `22023`; produto inexistente `P0002` (salvar); SKU duplicado `23505`; campo fora das regras da tabela `23514`; loja inexistente `23503`.
  - Substituição de vínculos (nas duas RPCs e em `definir_lojas_produto`) só remove lojas ativas: vínculo com loja desativada é preservado.
  - Trigger `lojas_vincular_produtos` agora é AFTER INSERT OR UPDATE OF ativo: loja criada ativa ou reativada (false para true) recebe todos os produtos ativos que faltam.
  - O app já usa as duas RPCs novas (uma chamada por criação/edição).
- Migração 0004 (corridas), estado final das RPCs:
  - `criar_produto_com_lojas(p_sku text, p_nome text, p_categoria text, p_fator_caixa integer, p_estoque_minimo_unidades integer, p_ativo boolean, p_loja_ids uuid[]) returns uuid` (assinatura inalterada).
  - `salvar_produto_com_lojas(p_produto_id uuid, p_sku text, p_nome text, p_categoria text, p_fator_caixa integer, p_estoque_minimo_unidades integer, p_loja_ids uuid[]) returns public.produtos`: não recebe nem altera `ativo` (ativar/desativar tem fluxo próprio); devolve a linha atualizada (no supabase-js, `rpc` retorna um objeto com as colunas de `produtos`). `p_loja_ids` nulo mantém os vínculos; vazio dá `22023`. A assinatura antiga (com `p_ativo`) foi removida.
  - `definir_lojas_produto(p_produto_id uuid, p_loja_ids uuid[]) returns void` (inalterada).
  - Nas três: id de loja inexistente, nulo ou inativa dá `22023` com hint `lojas_invalidas` (antes da gravação; o `23503` deixa de ocorrer na prática).
  - Triggers em lojas: `lojas_vincular_produtos_insert` (AFTER INSERT, `when (new.ativo)`) e `lojas_vincular_produtos_reativar` (AFTER UPDATE OF ativo, `when (new.ativo and old.ativo is distinct from true)`).
  - O app (src/) já está compatível com a 0004: `salvarComLojas` não envia `ativo`, não lê antes, usa a linha devolvida pela RPC e envia `p_loja_ids` nulo quando a edição não informa lojas. Aplicar a 0004 só junto com esta versão do app (a 0003 não aceita a chamada nova e vice-versa).
  - Erros tipados no repositório: `22023` com hint `lojas_invalidas` vira `LojasProdutoInvalidasError` ("Uma ou mais lojas selecionadas não estão disponíveis. Recarregue a página."); `22023` sem o hint vira `LojasProdutoInvalidasError` com "Marque ao menos uma loja para o produto."; demais códigos viram erro genérico (detalhe só no log).
- Testes estáticos: `tests/supabase/migracao-0002.test.ts`, `migracao-0003.test.ts` e `migracao-0004.test.ts`. Validação no banco real: DB-006.

## Conversão (`src/modules/produtos/unidades.ts`)
Funções puras, sem Supabase. Único lugar onde existe conta de caixa.

- `paraUnidades(caixas, unidades, fator): number` = `caixas * fator + unidades`. Exemplo: 3 cx + 10 un, fator 24 = 82.
- `paraCaixas(total, fator): { caixas, unidades }` com `caixas = floor(total / fator)` e `unidades = total % fator`. Exemplo: 82, fator 24 = 3 cx + 10 un.
- `FatorInvalidoError`: fator zero, negativo, não inteiro, NaN ou Infinity.
- `QuantidadeInvalidaError`: caixas, unidades ou total negativos, não inteiros, NaN ou Infinity.

Testes: `tests/modules/produtos/unidades.test.ts`.
