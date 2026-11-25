---
agent: story-validator
data: 2026-11-25
origem: agent
---

## decisao
- Loja nova recebe todos os produtos ativos; produtos existentes vão para todas as lojas ativas via trigger e backfill na migração. `0002_produto_lojas.sql:35-68`. Porquê: manter consistência automática sem ação manual.
- Produto exige ao menos uma loja, validado no serviço e rejeitado na RPC do banco. `regras.ts:90-112`, `0002_produto_lojas.sql:81-83`. Porquê: garantir que produto apareça em alguma loja.
- Filtro por loja em contagem/requisição/estoque sai desta task (PRO-001). Porquê: dependências altas, maturar antes.

## padrao
- Erros de banco: traduzir na camada repositório, logar apenas o código (nunca mensagens). `repositorio.ts:49-54`.
- Migrações SQL: idempotentes com `if not exists`, `drop policy if exists`, `on conflict do nothing`, transação única. `0002_produto_lojas.sql`.
- RLS para `authenticated` apenas; `anon` bloqueado. `0002_produto_lojas.sql:20-33`.
- Checkboxes com erro: ligar ao `fieldset` do grupo, não a cada item. `formulario.tsx:96-118`.

## feature
- Produto por loja: vincular a múltiplas lojas com loja nova ligada a produtos ativos e produto exigindo ao menos uma. Migração `0002_produto_lojas.sql`, serviço `servico.ts:59-86`, RPC `definirLojas`, repositório `repositorio.ts:131-143`, UI `formulario.tsx`, testes `lojas-produto.test.ts`. Validação no banco real (DB-006) pendente.
