---
name: migracao-supabase
description: Cria tabelas e migrações do Supabase com RLS e SQL idempotente. Use ao criar ou alterar tabela, política, índice ou função em supabase/migrations.
---
<!-- GERADO por scripts/sync-harness.ts a partir de .claude/skills/migracao-supabase/SKILL.md. Não edite aqui: edite a fonte e rode o script. -->
# Migração Supabase

Padrões: `docs/padroes.md` (segurança e arquitetura).

## Quando usar
- Criar ou alterar tabela, coluna, índice, política RLS ou função SQL.

## Passos
1. Criar `supabase/migrations/NNNN_descricao.sql` (numeração sequencial, nunca editar uma migração já aplicada; criar uma nova).
2. SQL idempotente: `create table if not exists`, `add column if not exists`, `create index if not exists`; políticas com `drop policy if exists` antes de `create policy`.
3. Quantidades sempre em unidades (`integer`/`bigint`), nunca caixas e unidades separadas.
4. Ativar RLS em toda tabela nova: `alter table ... enable row level security;`.
5. Política padrão: só usuário autenticado (`to authenticated using (true) with check (true)`). Nenhuma política para `anon`.
6. Operações que mexem em saldo (confirmar contagem, lançar requisição ou transferência) ficam em função SQL ou transação única, nunca em chamadas soltas do cliente.
7. Escrever o teste: usuário autenticado lê e grava; cliente anônimo (chave pública, sem login) é bloqueado; rodar a migração duas vezes não dá erro.
8. Atualizar `docs/modulos/<modulo>.md` e `docs/CHANGELOG.md`.

## Exemplo
```sql
create table if not exists lojas (
  id uuid primary key default gen_random_uuid(),
  nome text not null unique,
  criada_em timestamptz not null default now()
);
alter table lojas enable row level security;
drop policy if exists lojas_autenticado on lojas;
create policy lojas_autenticado on lojas
  for all to authenticated using (true) with check (true);
```

## Quando NÃO usar
- Só consultar dados ou alterar código da aplicação sem mudar o banco.
- Nunca usar a chave de serviço para contornar RLS no navegador; ela fica só no servidor.
