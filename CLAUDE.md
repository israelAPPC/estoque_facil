# EstoqueFácil

> Sistema web interno que controla o estoque de múltiplas lojas (contagens, requisições e transferências), substituindo as planilhas e mostrando o saldo real e as divergências.

> Este arquivo é só o essencial. Detalhes de cada módulo estão em
> docs/modulos/ (leia o doc ANTES de mexer no módulo). Histórico:
> docs/CHANGELOG.md.

## Regras obrigatórias

- Pendências: tudo que ficar pendente/adiado/mockado/débito técnico vai em
  PENDENCIAS.md (raiz) antes de encerrar a tarefa; regra completa em
  .claude/rules/pendencias.md.
- Documentação: ao concluir feature/correção, atualizar docs/modulos/<modulo>.md
  e docs/CHANGELOG.md. Nunca registrar histórico ou detalhe de módulo neste arquivo.
  O GEMINI.md só muda se o índice ou as regras gerais mudarem (o índice dele é gerado
  por `node scripts/sync-harness.ts`; rules, agents e skills nascem em .claude/).
- Orquestração: toda solicitação do usuário passa pelo agente `orquestrador`
  (.claude/agents/orquestrador.md), que esclarece, monta o plano com mapa de
  paralelismo e delega aos agents e squads. Ele não escreve código. Para tarefa
  de módulo, o orquestrador indica qual doc de docs/modulos/ o agent deve ler e
  confere ao final que o doc do módulo e o CHANGELOG foram atualizados.

## Stack

| Camada               | Tecnologia                        |
| -------------------- | --------------------------------- |
| Framework            | Next.js (App Router) + TypeScript |
| Banco e autenticação | Supabase (Postgres + Auth)        |
| Hospedagem           | Vercel                            |
| Estilo               | Tailwind CSS                      |
| Planilhas            | SheetJS                           |
| Testes               | Vitest                            |

## Estrutura de pastas (resumo)

Proposta inicial; será confirmada no scaffold (etapa 6).

```
src/app/        # rotas e páginas (App Router)
src/modules/    # um subdiretório por módulo do SPEC
src/lib/        # utilitários e cliente Supabase
supabase/       # migrações SQL
tests/          # testes, espelhando src/
docs/           # modulos/, CHANGELOG, padrões, decisões
```
Versão completa em docs/estrutura-de-pastas.md.

## Como rodar localmente

- Backend: não há servidor separado (Next.js + Supabase). Copie `.env.example` para `.env.local` e preencha.
- Frontend: `npm install`, depois `npm run dev` (http://localhost:3000).
- Verificação: `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`.

## Padrões de código

- Nomenclatura de arquivos: a definir
- Nomenclatura de variáveis e funções: a definir
- Estrutura de endpoints: a definir
- Estrutura de componentes: a definir
- Tipagem: a definir (ver docs/padroes.md)

## TDD

- Framework backend: Vitest
- Framework frontend: Vitest
- Onde ficam os testes: `tests/` (espelha `src/`), arquivos `*.test.ts`
- Regra: cobertura mínima a definir
- Testes críticos deste projeto:
  - [ ] Conversão caixa/unidade: 3 caixas + 10 un com fator 24 = 82 un, e o caminho inverso
  - [ ] Contagem confirmada substitui o saldo da loja, calcula a diferença contra a anterior e não altera contagens antigas
  - [ ] Requisição baixa só o saldo da loja correta; transferência baixa a origem e soma no destino; saldo negativo avisa e permite
  - [ ] Importação rejeita linhas inválidas e não duplica produtos

## Nunca fazer

- Nunca expor a chave de serviço do Supabase ao navegador
- Nunca deixar rota ou dado acessível sem login
- Nunca guardar quantidade em caixas e unidades separadas; guardar na menor unidade e converter só na exibição
- Nunca alterar ou apagar contagens antigas ao confirmar uma nova
- Nunca registrar histórico ou detalhe de módulo neste arquivo; use
  docs/modulos/ e docs/CHANGELOG.md

## Decisões em aberto

- Ver docs/decisoes-em-aberto.md

## Índice de módulos (leia o doc antes de mexer)

- Autenticação → docs/modulos/autenticacao.md — login, proteção de rotas
- Lojas → docs/modulos/lojas.md — cadastro de lojas
- Produtos → docs/modulos/produtos.md — cadastro, SKU, fator caixa→unidade
- Importação → docs/modulos/importacao.md — planilhas de produtos e estoque inicial
- Contagem → docs/modulos/contagem.md — contagem por loja/data, rascunho, comparação
- Requisições → docs/modulos/requisicoes.md — consumo, transferência, recálculo de saldo
- Estoque → docs/modulos/estoque.md — consulta geral e por loja
- Histórico → docs/modulos/historico.md — contagens, requisições, exportação Excel/CSV
- Padrões de engenharia, segurança e Definition of Done → docs/padroes.md
- Memória (bugs, decisões, o que não funcionou) → rag.db, busca automática; ver docs/rag.md
- Rules (segurança e convenções sempre ativas; as demais carregam por pasta) → .claude/rules/
