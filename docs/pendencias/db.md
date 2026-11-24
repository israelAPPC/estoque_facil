# Pendências: Banco de dados (DB)

Texto completo dos itens abertos. Resumo e P0/P1 em PENDENCIAS.md.

<a id="db-001"></a>
### DB-001: Validar migração 0001 no Supabase de teste: RLS, gravação autenticada e idempotência.

**P1 · VALIDAR** · origem: 2026-11-24

O teste estático (`tests/supabase/migracao-0001.test.ts`) passa, mas o comportamento real só se confirma no banco. Roteiro em docs/validacoes-banco-real.md (seção Banco Supabase de teste): rodar a migração duas vezes e `npm run test:db`.

<a id="db-003"></a>
### DB-003: Testar no banco que contagem confirmada não pode ser apagada nem ter itens alterados.

**P2 · TESTE** · origem: 2026-11-24

As políticas exigem `status = 'rascunho'` para update/delete em `contagens` e `contagem_itens` (coberto pelo teste estático), mas o cliente não consegue criar uma contagem confirmada sem a função de confirmação (Task 3.x). Ao criar a função, acrescentar em `tests/supabase/rls.dbtest.ts`: confirmar via função e verificar que DELETE na contagem e PATCH/DELETE/POST em seus itens são negados.

<a id="db-004"></a>
### DB-004: Ajustar .claude/rules/supabase.md para security definer conforme ADR 0001.

**P2 · DÉBITO** · origem: 2026-11-24

A rule ainda manda `security invoker` para funções que mudam saldo; a ADR 0001 decidiu `security definer` com `set search_path = ''`, checagem de `auth.uid()` e grants restritos. Fora do escopo do agent-db; ajustar pelo responsável pelo harness.

<a id="db-005"></a>
### DB-005: Importação não pode gravar com service role: criado_por fica nulo e o insert falha.

**P2 · DÉBITO** · origem: 2026-11-24

`criado_por` é `not null` e vem de `auth.uid()` via trigger; com a chave de serviço não há usuário, então o insert em contagens/requisicoes falha. Ao implementar a importação (estoque inicial como contagem inicial), gravar pela sessão do usuário logado, não pela service role.
