# Banco de dados (Supabase)

Estado atual do schema. Migrações em `supabase/migrations/`; guia em `docs/supabase-passo-a-passo.md`.

## Migrações
- `0001_schema.sql`: tabelas, índices, permissões e RLS iniciais. Idempotente.

## Tabelas
| Tabela | Chave | Pontos-chave |
|---|---|---|
| lojas | id | `nome` único sem diferenciar maiúsculas/espaços (`lower(trim(nome))`); `ativo` (sem exclusão física) |
| produtos | id | `sku` único sem diferenciar maiúsculas/espaços (`lower(trim(sku))`); `fator_caixa > 0`; `estoque_minimo_unidades`; `ativo` |
| contagens | id | `loja_id`, `data_contagem` (timestamptz), `status` rascunho/confirmada, `omitidos` manter/zerar (escolha única da contagem), `inicial` (no máximo uma por loja), `confirmada_em`, `criado_por`; confirmada exige `omitidos` |
| contagem_itens | (contagem_id, produto_id) | `quantidade_unidades >= 0` |
| requisicoes | id | `tipo` consumo/transferencia; `loja_id` (origem); `loja_destino_id` só em transferência e diferente da origem; `data_movimento` (timestamptz); `criado_por` |
| requisicao_itens | (requisicao_id, produto_id) | `quantidade_unidades > 0` |
| estoque_atual | (loja_id, produto_id) | `quantidade_unidades` (pode ser negativa) |

`criado_por` (contagens, requisicoes): not null, FK para `auth.users`, preenchido pelo trigger `definir_criado_por` com `auth.uid()` no insert e preservado no update; valor do cliente é ignorado.

Inserts feitos com a chave de serviço (service role) não têm `auth.uid()`: `criado_por` fica nulo e o insert falha (not null). Toda gravação em contagens e requisições deve ir pela sessão do usuário logado. Ver DB-005 (importação).

Quantidades sempre `integer` na menor unidade. FKs para lojas e produtos são `on delete restrict`.

`contagem_itens.contagem_id` também é `on delete restrict` (FK `contagem_itens_contagem_id_fkey`, recriada por drop + add para ser idempotente). Impacto: para apagar um rascunho, o cliente apaga primeiro os itens (permitido enquanto rascunho) e depois a contagem; apagar a contagem com itens falha.

Usuário se desativa, nunca se exclui: `criado_por` é FK `restrict` para `auth.users`, então excluir um usuário que criou contagem ou requisição falha por design.

## Acesso (RLS)
- RLS ativo em todas; `anon` sem permissão nem política; políticas só para `authenticated`.
- lojas, produtos: select, insert, update (sem delete).
- contagens, contagem_itens: select livre; insert/update/delete só com status `rascunho`. O cliente não pode gravar `inicial = true` (insert nem update: with check `status = 'rascunho' and not inicial`); só a função de importação marca contagem inicial. O cliente não consegue confirmar (with check exige rascunho): a confirmação será função SQL transacional (task 3.x).
- requisicoes, requisicao_itens: só select. Gravação só por função `security definer` (ADR 0001, Task 3.2); até lá não há como lançar requisição.
- estoque_atual: só select. Saldo muda só por função SQL transacional (task 3.x).

## Testes
- `tests/supabase/migracao-0001.test.ts` (estático, no `npm test`).
- `tests/supabase/rls.dbtest.ts` (`npm run test:db`, projeto de teste, variáveis `TEST_SUPABASE_*`).
