# Lojas

Cadastro de lojas (criar, editar, listar, desativar/reativar), com tela em /lojas. Seletor de loja para outros módulos: ainda não feito.

## Regras
- Loja nunca é excluída: só desativada (e pode ser reativada). Não há política de delete no banco. (A decisão em aberto "excluir x desativar" fica resolvida para lojas por instrução do usuário em 2026-11-24.)
- Nome obrigatório, até 80 caracteres, aparado; único sem diferenciar maiúsculas (índice `lojas_nome_unico_idx`). Duplicado: "Já existe uma loja com esse nome."
- Entrada validada com zod (`esquemaLoja`); erro do banco nunca vai ao cliente (mensagem genérica, detalhe no log).
- Listagem paginada (20 por página), ordenada por nome.
- `id` (uuid) e `ativo` (boolean) são validados com zod no serviço e nas ações; entrada inválida devolve o erro genérico. Falha ao desativar/reativar aparece na tela (`botao-ativo.tsx`).
- Sem sessão, as páginas redirecionam para /login.

## Arquivos
- `src/modules/lojas/servico.ts`: `criarLoja`, `editarLoja`, `definirAtivoLoja`, `listarLojas`, `obterLoja` (recebem um `RepositorioLojas`).
- `src/modules/lojas/tipos.ts`: tipos, `NomeDuplicadoError` e `LojaErroDesconhecidoError` (erro tipado de acesso a dados; a página de edição usa `obterLoja`, nunca o Supabase direto).
- `src/modules/lojas/repositorio.ts`: único ponto que usa o Supabase (código 23505 vira `NomeDuplicadoError`).
- Testes: `tests/modules/lojas/servico.test.ts`.
- `src/modules/lojas/pagina.ts`: `interpretarPagina` (parâmetro `?pagina=`); teste em `tests/modules/lojas/pagina.test.ts`.
- Tela em `src/app/(app)/lojas/`: `page.tsx` (lista paginada, 20 por página), `nova/page.tsx`, `[id]/page.tsx` (editar), `formulario.tsx`, `botao-ativo.tsx` (desativar pede confirmação), `actions.ts` (ações de servidor; exigem sessão via `obterUsuario()`).

## Pendências
LOJ-002 (seletor de loja), LOJ-003 (validar tela em ambiente real e testar ações).
