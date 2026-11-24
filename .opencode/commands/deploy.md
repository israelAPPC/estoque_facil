---
description: Confere se está pronto para publicar: code-reviewer; se houver bloqueantes, aciona /analisa-bug e /corrigir-bug
agent: orquestrador
---

Preparação de deploy (quem publica é o usuário).

1. Rode `npm run lint`, `npm run typecheck`, `npm test` e `npm run build` e guarde os resultados.
2. Delegue ao **code-reviewer** a revisão do projeto contra SPEC.md, PLAN.md e docs/padroes.md, informando esses resultados. Peça atenção a segurança (RLS, chave de serviço, rotas sem login, cabeçalhos/CSP), variáveis de ambiente e dependências.
3. Se houver **BLOQUEANTE**: execute o fluxo do /analisa-bug e depois do /corrigir-bug para cada um e reexecute a revisão (máx. 3 ciclos; depois escale ao usuário).
4. Sem bloqueantes: confira PENDENCIAS.md e docs/decisoes-em-aberto.md e liste o que ainda pode atrapalhar.
5. Sinalize a conclusão: "Pronto para você publicar" com o passo a passo (variáveis na Vercel, migrações a aplicar), **sem rodar vercel, push nem supabase db push**.

Regras: siga o fluxo do orquestrador (.claude/agents/orquestrador.md); nunca faça commit, push ou deploy; pendências em PENDENCIAS.md; histórico só em docs/CHANGELOG.md, nunca no CLAUDE.md.
