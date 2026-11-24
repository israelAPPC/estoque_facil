---
paths:
  - "supabase/**"
---

# Banco (Supabase)

A skill migracao-supabase tem o passo a passo; aqui as restrições.

- Migração nova em `supabase/migrations/NNNN_descricao.sql`; migração aplicada nunca é editada.
- Idempotente: `if not exists`, `drop policy if exists` antes de `create policy`.
- Quantidade em `integer`/`bigint`, sempre em unidades.
- Tabelas de contagem e movimento: sem política de `update`/`delete` para `authenticated` (imutáveis).
- Função SQL que muda saldo: transação única, `security invoker` (respeita RLS) salvo decisão registrada em ADR.
- Nunca `supabase db push`, `link` ou `reset`: o usuário aplica as migrações (hook bloqueia).
- Nada de segredo ou URL real do projeto nos arquivos SQL ou de seed.
