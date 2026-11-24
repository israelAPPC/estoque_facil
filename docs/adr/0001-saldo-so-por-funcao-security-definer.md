# 0001 — Saldo e movimentos só por função SQL `security definer`

- Status: aceita
- Data: 2026-11-24

## Contexto

`estoque_atual` guarda o saldo e é só leitura para `authenticated`. Contagem confirmada, requisição, transferência e importação precisam alterar o saldo e o histórico na mesma transação. Com insert direto em `requisicoes`/`requisicao_itens`, o cliente poderia gravar movimento sem baixar saldo, ou acrescentar itens a requisição antiga.

## Decisão

- Nenhum insert/update/delete direto de `authenticated` em `requisicoes`, `requisicao_itens` e `estoque_atual`; confirmação de contagem também só por função.
- Toda mudança de saldo é feita por função SQL transacional `security definer`, com `set search_path = ''` (nomes qualificados), checagem de `auth.uid() is not null` no início, `revoke execute ... from public, anon` e `grant execute ... to authenticated`.
- O autor (`criado_por`) é definido pela função/trigger a partir de `auth.uid()`, nunca pelo cliente.

## Alternativas consideradas

- `security invoker` com update liberado via RLS em `estoque_atual`: descartada; o cliente poderia sobrescrever o saldo direto.
- Insert direto em requisições com bloqueio parcial: descartada; saldo e histórico podem divergir.

## Consequências

- Saldo e histórico não divergem; regra de saldo concentrada no banco.
- Cada função `security definer` exige revisão com opus (code-reviewer) e testes de RLS/permissão em `npm run test:db`.
- Até a Task 3.2 não existe forma de gravar requisição; isso é esperado.
- Substitui a orientação de `security invoker` em `.claude/rules/supabase.md` (ajuste da rule pendente).
