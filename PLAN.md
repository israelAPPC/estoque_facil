# PLAN.md

Convenções: caminhos seguem a estrutura proposta no CLAUDE.md (`src/modules/<modulo>/`, `tests/` espelhando `src/`, `supabase/migrations/`). Pré-requisito geral: scaffold (etapa 6) concluído, com `npm test` rodando.
Sprints concluídas vão para `docs/plan-arquivo.md`.

## Sprint 1 — Com login, é possível lançar uma contagem e uma requisição e ver o estoque atualizado por loja, com `npm test` e `npm run build` passando.

### Fase 1 — Banco e regras puras

> Dependências: nenhuma
> Paralelismo: tasks 1.1, 1.2, 1.3 e 1.4 rodam em paralelo (cada uma define seus próprios tipos de entrada)

#### Task 1.1 — Schema e guia do Supabase

- Agent: DB (Supabase/Postgres)
- Input: SPEC.md; projeto Supabase criado pelo usuário seguindo o guia
- Output: `docs/supabase-passo-a-passo.md` (criar projeto, copiar URL e chaves, preencher `.env`, rodar migração) e `supabase/migrations/0001_schema.sql` com as tabelas `lojas`, `produtos`, `contagens`, `contagem_itens`, `requisicoes`, `requisicao_itens` e `estoque_atual` (loja_id, produto_id, quantidade_unidades), RLS ativado em todas, política "só usuário autenticado". Quantidades sempre em unidades. Decidido em 2026-11-24: `estoque_atual` é só leitura para `authenticated` (saldo muda só por função SQL transacional); contagem editável só com status `rascunho`, confirmada imutável; lojas e produtos têm coluna `ativo` (desativar, sem exclusão física); escolha manter/zerar omitidos vale para a contagem toda; contagens e movimentos guardam timestamp (data e hora).
- Testes críticos:
  - [ ] Usuário autenticado lê e grava nas tabelas
  - [ ] Cliente anônimo (chave pública, sem login) é bloqueado por RLS em todas as tabelas
  - [ ] Rodar a migração duas vezes não gera erro (idempotente)

#### Task 1.2 — Conversão caixa/unidade

- Agent: Produtos
- Input: nenhum
- Output: `src/modules/produtos/unidades.ts` com `paraUnidades(caixas: number, unidades: number, fator: number): number` e `paraCaixas(total: number, fator: number): { caixas: number; unidades: number }`; `tests/modules/produtos/unidades.test.ts`
- Testes críticos:
  - [x] 3 caixas + 10 un com fator 24 = 82; e 82 com fator 24 = 3 caixas + 10 un
  - [x] Fator zero, negativo ou não inteiro lança erro tipado; quantidade negativa é rejeitada

#### Task 1.3 — Cálculo de saldo

- Agent: Estoque
- Input: nenhum
- Output: `src/modules/estoque/saldo.ts` com `calcularSaldo(base: { data: string; quantidade: number } | null, movimentos: { data: string; delta: number }[]): number`, onde o saldo é a contagem-base mais os movimentos com data posterior à base (`data` é timestamp ISO com hora, decidido em 2026-11-24: entra só o movimento com instante estritamente posterior ao da contagem); `tests/modules/estoque/saldo.test.ts`
- Testes críticos:
  - [x] Com contagem-base, só movimentos posteriores à base entram no saldo
  - [x] Movimento retroativo (data anterior à base) é ignorado no saldo
  - [x] Sem contagem-base, o saldo é a soma dos movimentos; saldo negativo é devolvido sem erro

#### Task 1.4 — Comparação de contagens

- Agent: Contagem
- Input: nenhum
- Output: `src/modules/contagem/comparar.ts` com `compararContagens(atual: ItemContado[], anterior: ItemContado[] | null): Diferenca[]`, onde cada diferença traz produto, anterior, atual e delta (produto presente só na anterior aparece marcado como "omitido", sem delta, até o usuário escolher manter ou zerar; decidido em 2026-11-24); `tests/modules/contagem/comparar.test.ts`
- Testes críticos:
  - [x] Delta correto por produto (atual 82, anterior 100 → -18); produto novo tem anterior 0
  - [x] Sem contagem anterior, devolve as diferenças marcadas como "inicial"; as listas de entrada não são alteradas

**Critério de conclusão da fase:** `npx vitest run tests/modules/produtos tests/modules/estoque tests/modules/contagem` passa, e `npm run test:db` (testes da Task 1.1 contra o Supabase) passa.

### Fase 2 — Autenticação e cadastros

> Dependências: Fase 1 (Task 1.1 para o banco)
> Paralelismo: tasks 2.1, 2.2 e 2.3 rodam em paralelo

#### Task 2.1 — Autenticação

- Agent: Autenticação
- Input: schema aplicado e `.env` preenchido
- Output: `src/proxy.ts` (nome novo do middleware no Next.js; decisão 2026-11-24) (redireciona não logado para `/login`), `src/app/login/page.tsx`, `src/modules/autenticacao/sessao.ts` com `obterUsuario()`; `docs/modulos/autenticacao.md`
- Testes críticos:
  - [ ] Login com e-mail e senha corretos cria sessão e redireciona para a página inicial
  - [x] Acesso sem sessão a qualquer rota protegida redireciona para `/login`; senha errada mostra mensagem genérica, sem detalhe do erro

#### Task 2.2 — Lojas

- Agent: Lojas
- Input: schema aplicado; sessão disponível
- Output: `src/modules/lojas/servico.ts` (`listarLojas`, `criarLoja`, `editarLoja`), `src/app/lojas/page.tsx`; `docs/modulos/lojas.md`
- Testes críticos:
  - [x] Criar loja com nome válido grava a loja e ela aparece na listagem (unitário; banco real em LOJ-003)
  - [x] Nome vazio ou duplicado é rejeitado com erro de validação

#### Task 2.3 — Produtos

- Agent: Produtos
- Input: schema aplicado; Task 1.2 concluída
- Output: `src/modules/produtos/servico.ts` (`listarProdutos`, `criarProduto`, `editarProduto`), `src/app/produtos/page.tsx`; campos: nome, SKU, categoria, estoque mínimo, fator caixa→unidade; `docs/modulos/produtos.md`
- Testes críticos:
  - [x] Produto válido é criado; produto controlado por caixa exige fator maior que 0
  - [x] SKU duplicado é rejeitado; estoque mínimo negativo é rejeitado

#### Task 2.4 — Produto por loja (decisão do usuário, 2026-11-24)

- Agents: DB (tabela de vínculo `produto_lojas` com RLS), depois Produtos (checkboxes no cadastro)
- Regra: no cadastro do produto, checkboxes marcam em quais lojas ele existe; produto novo vem com todas as lojas marcadas; o produto só aparece nas lojas marcadas em contagem, requisição e estoque
- Testes críticos:
  - [x] Produto novo é vinculado a todas as lojas ativas; desmarcar uma loja remove o vínculo
  - [x] Listagem de produtos por loja devolve só os vinculados àquela loja

**Critério de conclusão da fase:** `npx vitest run tests/modules/autenticacao tests/modules/lojas tests/modules/produtos` passa e `npm run build` termina sem erro.

### Fase 3 — Contagem, requisições e estoque

> Dependências: Fase 2 e tasks 1.3 e 1.4
> Paralelismo: tasks 3.1, 3.2 e 3.3 rodam em paralelo (usam as funções puras da Fase 1, sem depender uma da outra)

#### Task 3.1 — Contagem de estoque

- Agent: Contagem
- Input: lojas e produtos cadastráveis; `compararContagens`
- Output: `src/modules/contagem/servico.ts` (`salvarRascunho`, `confirmarContagem(contagemId, itensOmitidos: 'manter' | 'zerar')`), `src/app/contagem/page.tsx`; ao confirmar, o `estoque_atual` da loja é substituído pelos valores contados em uma transação e a comparação com a anterior é exibida; `docs/modulos/contagem.md`
- Testes críticos:
  - [ ] Confirmar contagem substitui o saldo da loja e não altera contagens antigas
  - [ ] Rascunho não altera o estoque; confirmar duas vezes a mesma contagem é rejeitado
  - [ ] Itens omitidos respeitam a escolha (manter ou zerar); contagem de uma loja não afeta outra

#### Task 3.2 — Requisições de saída

- Agent: Requisições
- Input: lojas e produtos cadastráveis; `calcularSaldo`
- Output: `src/modules/requisicoes/servico.ts` (`lancarConsumo`, `lancarTransferencia`), `src/app/requisicoes/page.tsx`; saldo negativo devolve aviso e permite confirmar; requisição com data anterior à última contagem recalcula o saldo a partir da contagem; `docs/modulos/requisicoes.md`
- Testes críticos:
  - [ ] Consumo baixa só a loja informada; transferência baixa a origem e soma no destino na mesma transação
  - [ ] Saldo que ficaria negativo devolve aviso e só grava com confirmação
  - [ ] Origem igual ao destino na transferência é rejeitada; quantidade zero ou negativa é rejeitada

#### Task 3.3 — Consulta de estoque

- Agent: Estoque
- Input: `estoque_atual` e `paraCaixas`
- Output: `src/modules/estoque/consulta.ts` (`estoqueGeral()`, `estoquePorLoja(lojaId)`), `src/app/estoque/page.tsx` exibindo caixas + unidades e destacando produtos abaixo do mínimo; `docs/modulos/estoque.md`
- Testes críticos:
  - [ ] Estoque geral soma as lojas; estoque por loja mostra só a loja pedida
  - [ ] Quantidade exibida em caixas + unidades (82 un, fator 24 → 3 cx + 10 un); produto sem movimentação aparece com 0

**Critério de conclusão da fase:** `npx vitest run tests/modules/contagem tests/modules/requisicoes tests/modules/estoque` passa e `npm run build` termina sem erro.

### Fase 4 — Integração e entrega

> Dependências: Fase 3
> Paralelismo: tasks 4.1 e 4.2 rodam em paralelo

#### Task 4.1 — Teste de fluxo completo

- Agent: Integração
- Input: Fase 3 concluída
- Output: `tests/integration/fluxo-estoque.test.ts` cobrindo contagem → requisição → transferência → consulta, contra o Supabase de desenvolvimento
- Testes críticos:
  - [ ] Contagem 100 un, consumo de 18 un e nova contagem de 80 un: o saldo final é 80, a comparação da segunda contagem mostra delta de -20 contra a contagem anterior (100) e as duas contagens ficam no histórico
  - [ ] Transferência entre duas lojas deixa a soma geral inalterada

#### Task 4.2 — Deploy na Vercel

- Agent: Integração
- Input: build passando
- Output: `docs/deploy-vercel.md` (importar o repositório, configurar as variáveis de ambiente, conferir que a chave de serviço não está exposta) e a rota `src/app/health/route.ts` retornando 200
- Testes críticos:
  - [ ] `GET /health` retorna 200 sem exigir login
  - [ ] Qualquer outra rota sem login redireciona para `/login`; nenhuma variável de serviço aparece no bundle do cliente

**Critério de conclusão da fase:** `npm test` e `npm run build` passam; a URL da Vercel exige login e `/health` responde 200.

## Sprint 2 — É possível importar produtos e o estoque inicial por planilha, consultar os históricos com filtros e exportar em Excel/CSV, com `npm test` passando.

### Fase 5 — Leitura de planilhas

> Dependências: Sprint 1
> Paralelismo: tasks 5.1 e 5.2 rodam em paralelo

#### Task 5.1 — Leitor de planilha

- Agent: Importação
- Input: nenhum (formato das colunas decidido junto com o usuário e registrado em `docs/modulos/importacao.md`)
- Output: `src/modules/importacao/leitor.ts` com `lerPlanilha(arquivo: ArrayBuffer, tipo: 'produtos' | 'estoque'): { linhas: LinhaValida[]; erros: { linha: number; mensagem: string }[] }`; `tests/modules/importacao/leitor.test.ts` com planilhas em `tests/fixtures/`
- Testes críticos:
  - [ ] Planilha válida (xlsx e csv) devolve todas as linhas e nenhum erro
  - [ ] Linha com coluna faltando ou número inválido gera erro com o número da linha; arquivo grande demais ou de tipo errado é rejeitado

#### Task 5.2 — Exportação

- Agent: Histórico
- Input: nenhum
- Output: `src/modules/historico/exportar.ts` com `exportar(linhas: Record<string, unknown>[], formato: 'csv' | 'xlsx'): Uint8Array`; `tests/modules/historico/exportar.test.ts`
- Testes críticos:
  - [ ] CSV e XLSX gerados reabrem com as mesmas linhas e colunas
  - [ ] Lista vazia gera arquivo só com cabeçalho; células que começam com `=`, `+`, `-` ou `@` são neutralizadas contra injeção de fórmula

**Critério de conclusão da fase:** `npx vitest run tests/modules/importacao tests/modules/historico` passa.

### Fase 6 — Importação, históricos e consultas

> Dependências: Fase 5
> Paralelismo: tasks 6.1, 6.2 e 6.3 rodam em paralelo

#### Task 6.1 — Importar produtos

- Agent: Importação
- Input: `lerPlanilha` e `criarProduto`/`editarProduto`
- Output: `src/modules/importacao/produtos.ts` (`importarProdutos(linhas)`) e `src/app/importacao/produtos/page.tsx` com prévia antes de gravar
- Testes críticos:
  - [ ] SKU novo cria produto; SKU existente atualiza sem duplicar
  - [ ] Importação com linha inválida não grava nada (tudo ou nada) e mostra os erros na prévia

#### Task 6.2 — Importar estoque inicial

- Agent: Importação
- Input: `lerPlanilha` e `confirmarContagem`
- Output: `src/modules/importacao/estoque-inicial.ts` (`importarEstoqueInicial(lojaId, linhas)`) e `src/app/importacao/estoque/page.tsx`; grava como contagem inicial no histórico, com valores em caixas + unidades convertidos para unidades
- Testes críticos:
  - [ ] Importação define o saldo da loja e aparece no histórico como contagem inicial
  - [ ] Loja ou SKU inexistente é rejeitado; a primeira contagem real compara com a contagem inicial

#### Task 6.3 — Históricos

- Agent: Histórico
- Input: contagens e requisições gravadas; `exportar`
- Output: `src/modules/historico/consultas.ts` (`listarContagens(filtros)`, `listarRequisicoes(filtros)` com paginação), `src/app/historico/page.tsx` com filtros por loja, data e produto e botão de exportar; `docs/modulos/historico.md`
- Testes críticos:
  - [ ] Filtros por loja, período e produto devolvem só os registros esperados, paginados
  - [ ] Histórico de contagem mostra a comparação com a anterior; a exportação sai com os mesmos filtros aplicados

**Critério de conclusão da fase:** `npm test` e `npm run build` passam.

---

Resumo do paralelismo:

- Fase 1: 1.1 ‖ 1.2 ‖ 1.3 ‖ 1.4
- Fase 2: 2.1 ‖ 2.2 ‖ 2.3
- Fase 3: 3.1 ‖ 3.2 ‖ 3.3
- Fase 4: 4.1 ‖ 4.2
- Fase 5: 5.1 ‖ 5.2
- Fase 6: 6.1 ‖ 6.2 ‖ 6.3

Agents no total: 10 (DB, Autenticação, Lojas, Produtos, Importação, Contagem, Requisições, Estoque, Histórico, Integração).
