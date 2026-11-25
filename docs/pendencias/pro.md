# Pendências: Produtos (PRO)

<a id="pro-001"></a>
### PRO-001: Fase 3 deve usar listarProdutosPorLoja nas telas de contagem, requisição e estoque.

**P1 · FEATURE** · origem: 2026-11-25

Task 2.4 entregou `listarProdutosPorLoja(repo, lojaId, { pagina })` em `src/modules/produtos/servico.ts`: devolve só os produtos vinculados à loja. As páginas de contagem, requisição e estoque ainda não existem; quando forem criadas (Fase 3), devem listar produtos por ele e nunca por `listarProdutos`, para que o produto só apareça nas lojas marcadas.

<a id="pro-002"></a>
### PRO-002: Validar no navegador o cadastro com checkboxes de lojas.

**P2 · VALIDAR** · origem: 2026-11-25

Depende de DB-006 (migrações 0002, 0003 e 0004 aplicadas, junto com o app novo). Conferir produto novo com todas marcadas, desmarcar loja na edição e erro ao desmarcar todas.

<a id="pro-003"></a>
### PRO-003: Decidir se vínculos em produto_lojas podem ser gravados direto pela API, fora das RPCs.

**P2 · DECISÃO** · origem: 2026-11-25

Hoje `authenticated` tem insert/delete direto em `produto_lojas` (0002), então a regra "ao menos uma loja" só é garantida dentro das RPCs. Opções: tirar insert/delete direto e deixar só as RPCs (exige ADR sobre security definer) ou trigger de restrição. Apontado pelo code-reviewer na Task 2.4.

<a id="pro-004"></a>
### PRO-004: definirAtivo de produto não acusa id inexistente; 22023 sem hint assume lista vazia.

**P3 · DÉBITO** · origem: 2026-11-25

`src/modules/produtos/repositorio.ts`: `definirAtivo` não confere linhas afetadas (id inexistente termina sem erro, deveria ser `ProdutoNaoEncontradoError`); todo 22023 sem hint vira "Marque ao menos uma loja" — dar hint próprio (`lojas_vazias`) nas RPCs. Sugestões da 3ª revisão da Task 2.4.
