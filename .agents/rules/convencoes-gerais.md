---
trigger: always_on
---
<!-- GERADO por scripts/sync-harness.ts a partir de .claude/rules/convencoes-gerais.md. Não edite aqui: edite a fonte e rode o script. -->
# Convenções gerais

Detalhes e Definition of Done em docs/padroes.md. Nomenclatura final ainda "a definir" no CLAUDE.md: siga o código existente.

- Português do Brasil em textos da interface, mensagens de erro e documentação; identificadores de código em inglês ou português, mas sempre o mesmo padrão do módulo vizinho.
- TypeScript strict; sem `any` em código novo; erros tipados em vez de strings.
- Camadas: rota/página → serviço (regra de negócio) → repositório (Supabase). Regra de negócio em função pura e testável, sem importar Supabase.
- Quantidade sempre na menor unidade; caixa/unidade só na exibição.
- Contagens e requisições são imutáveis; correção é novo lançamento.
- TDD: teste antes do código; bug vira teste de regressão antes da correção.
- Nomes dizem a intenção; funções pequenas; sem número mágico; abstrair só na 3ª repetição.
- Alias `@/` aponta para `src/`.
- Listagens e histórico com paginação.
- Antes de fechar tarefa: `npm run lint`, `npm run typecheck`, `npm test` (e `npm run build` se mexeu em rota); depois a skill fechar-tarefa.
- Decisão em aberto (docs/decisoes-em-aberto.md): não invente, pergunte.
- Faça só o que a task pede; extras viram item em PENDENCIAS.md.
- Pendência, adiamento, mock ou débito técnico: registrar em PENDENCIAS.md antes de encerrar.
- Conventional Commits e PRs pequenos (quando o usuário pedir commit).
