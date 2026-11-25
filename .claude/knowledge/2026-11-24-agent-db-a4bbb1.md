---
agent: agent-db
data: 2026-11-24
origem: agent
---

## feature
- Tabela `produto_lojas` (colunas: `produto_id`, `loja_id`, `criado_em`; chave primária composta; índice `produto_lojas_loja_idx` em `loja_id`) entregue em `supabase/migrations/0002_produto_lojas.sql`. RLS ativa com políticas para `authenticated` (select, insert, delete); nenhuma para `anon`.
- Backfill atômico: todo produto existente vinculado a todas as lojas ativas (ON CONFLICT DO NOTHING); trigger `lojas_vincular_produtos` vincula loja nova a todos os produtos ativos. Teste de idempotência em `tests/supabase/migracao-0002.test.ts`.
- RPC `definir_lojas_produto(p_produto_id uuid, p_loja_ids uuid[])` SECURITY INVOKER para gerenciar atomicamente as lojas de um produto (delete desmarcados + insert marcados em transação), rejeitando array vazio.

## decisao
- Loja nova vincula todos os produtos ativos; produto novo é responsabilidade do app (agent-produtos), não do banco. Reduz complexidade do trigger e concentra lógica de criação no app.
- Coluna de timestamp é `criado_em` (não `created_at`), seguindo padrão da migração 0001. Mantém coerência de nomenclatura.
- Soft delete via flag `ativo` (nunca delete físico de loja/produto). Preserva histórico e referências.
- RLS: políticas só para `authenticated` (select, insert, delete); nenhuma para `anon`. Dados de estoque requerem autenticação.

## padrao
- Migrações Supabase são idempotentes, transacionais (begin/commit), nunca editam versão anterior; usar `if not exists` em DDL e `drop policy if exists` antes de `create policy`.
- Nomes de timestamp em snake_case: `criado_em`, `atualizado_em`; seguir padrão existente.
- RLS obrigatória em tabelas novas; política padrão: `to authenticated using (true) with check (true)`.
- TDD em migrações: teste estático (tipos/contrato) falha antes, passa após migração; integração valida idempotência (rodar duas vezes).

## nao-funcionou
- CRLF em arquivo de migração durante edição; resolvido reescrevendo linhas com escape correto.
- Escapes em JSON de documentação quebraram; reescrito trecho direto sem processamento intermediário.
