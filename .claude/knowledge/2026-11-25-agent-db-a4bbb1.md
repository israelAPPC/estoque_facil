---
agent: agent-db
data: 2026-11-25
origem: agent
---

## bug
- **Lost update em `ativo`**: aplicação reenviava `ativo` ao salvar produto, podendo reativar produtos desativados intencionalmente. Corrigido removendo `p_ativo` de `salvar_produto_com_lojas` via `drop function if exists` (força nova assinatura) e fazendo a RPC devolver a linha completa do produto, eliminando a necessidade de reler do banco.
- **Corrida nas lojas**: `p_loja_ids` nulo deveria manter vínculos existentes, vazio deveria falhar. Corrigido com lógica de skip de delete/insert quando nulo e validação que lança 22023 (hint `lojas_invalidas`) quando vazio ou contém id inativo/inexistente.

## decisao
- **Retorno de `salvar_produto_com_lojas`**: muda de `void` para `returns public.produtos`, permitindo que o app obtenha a linha atualizada em uma única RPC em vez de fazer reler posterior. No supabase-js, o objeto devolvido contém todas as colunas (id, sku, nome, ativo, etc.).
- **Validação de lojas ativas**: apenas lojas ativas existentes podem ser vinculadas em `criar_produto_com_lojas`, `salvar_produto_com_lojas` e `definir_lojas_produto`. Se algum id for nulo, inexistente ou de loja inativa, a função falha com 22023 + hint identificável antes de gravar.
- **Triggers separados**: substituir trigger único `lojas_vincular_produtos` por dois: `_insert` (AFTER INSERT, `when new.ativo`) e `_reativar` (AFTER UPDATE OF ativo, `when new.ativo and old.ativo is distinct from true`), evitando disparos desnecessários em renomeação ou inserção de loja inativa.

## padrao
- Migrações idempotentes que usam `drop function if exists` antes de `create function` para contornar limitação de não poder alterar assinatura diretamente. Ideia: simular "alteração" via drop + create da nova.
- Funções SQL com `security invoker`, `search_path = ''`, sem grant para public/anon, execução restrita a `authenticated`. Validações que usam `raise exception` com código SQLSTATE específico (ex. 22023 para dados inválidos) e `hint` descritivo.

## nao-funcionou
- Tentar alterar assinatura de função existente sem drop prévio bloquearia a migração idempotente (Supabase/PostgreSQL rejeita redeclaração com assinatura diferente).

## feature
- **Migração 0004** (`supabase/migrations/0004_produto_lojas_corridas.sql`): corrige lost update e race conditions via nova assinatura de `salvar_produto_com_lojas(p_produto_id, p_sku, p_nome, p_categoria, p_fator_caixa, p_estoque_minimo_unidades, p_loja_ids) returns public.produtos`, validação de lojas ativas com erro 22023 + hint `lojas_invalidas`, tratamento de `p_loja_ids` nulo (mantém vínculos) vs vazio (erro), triggers separados por operação (insert + reativar). Testes de idempotência em `tests/supabase/migracao-0004.test.ts`.
