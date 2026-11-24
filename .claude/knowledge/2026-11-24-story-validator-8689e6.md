---
agent: story-validator
data: 2026-11-24
origem: agent
---

## decisao
- Registros nunca são excluídos, apenas desativados (campo `ativo` falso); aplicado em `src\modules\lojas\servico.ts` (`definirAtivoLoja`) e `src\modules\produtos\servico.ts` (`alterarAtivo`) para preservar rastreabilidade e histórico.
- Nomes únicos (loja, SKU) são case-insensitive via `lower(trim(...))` na constraint SQL (`0001_schema.sql:16-17,30-32`), reduzindo duplicatas por variação de maiúsculas e espaços.
- Validações com limites de tipo: fator ≥ 1 (inteiro), estoque mínimo ≥ 0; definidos em `regras.ts` e aplicados antes do servidor.

## padrao
- Validações centralizadas em `regras.ts` com Zod schema (`src\modules\produtos\regras.ts:31-56`); erros SQL (código 23505) mapeados a exceções da app em `repositorio.ts` (ex.: `SkuDuplicadoError`).
- Testes em dois níveis: unitários com repositório mockado (`tests\modules\*\servico.test.ts`) + testes de migração (`tests\supabase\migracao-0001.test.ts`) validam constraints do banco sem mock.
- Proteção de rotas centralizada em `src\proxy.ts:4-10` chamando `src\lib\supabase\sessao-proxy.ts:27-31`; páginas revalidam com `obterUsuario()`.

## nao-funcionou
- Consulta direta ao Supabase em Server Component: `src\app\(app)\lojas\[id]\page.tsx:18-23` viola a regra de passar por `servico.ts`. O padrão correto está em produtos (`[id]/page.tsx` chama `obterProduto` do repositório).

## feature
- Autenticação (Task 2.1): Login em `src\app\login\actions.ts`, sessão em `src\modules\autenticacao\sessao.ts`, proteção em `src\proxy.ts`, erro genérico para senha errada em `login.ts:34`.
- Lojas (Task 2.2): Listar, criar, editar e desativar com nome único case-insensitive em `src\modules\lojas\servico.ts`; índice no banco em `0001_schema.sql:16-17`.
- Produtos (Task 2.3): Listar, criar, editar e desativar com SKU único case-insensitive, fator ≥ 1 (inteiro) e estoque mínimo ≥ 0 em `src\modules\produtos\regras.ts:31-56`.
