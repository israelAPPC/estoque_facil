# Pendências resolvidas

Itens resolvidos, obsoletos ou mesclados, com a evidência. Texto original preservado.

## Agents, hooks e comandos (AGT)

- **2026-11-24** Hooks de agents criados; bloqueio de `git push`/`rm -rf` incluído. Evidência: docs/hooks.md; .claude/hooks/_lib.mjs (COMANDOS_PROIBIDOS).
- **2026-11-24** `@code-reviewer` criado (`.claude/agents/code-reviewer.md`). Evidência: .claude/agents/code-reviewer.md; docs/agentes.md.

- **2026-11-24** AGT-008: "reading 'config'" no Vitest. Causa: cwd com disco em minúscula ("c:...", comum via cmd/hook) faz o CLI carregar vitest de `c:/` enquanto o Vite resolve o import dos testes como `C:/`, gerando 2 instâncias. Reproduzido com `cmd /c "cd /d c:... && npm test"` (13 de 13 falham; com `C:` passam; Git Bash e PowerShell passam). Correção: alias `vitest` ancorado em `process.cwd()` no vitest.config.ts. Evidência: vitest.config.ts; tests/config/disco-minusculo.test.ts (falha sem a correção, passa com ela). Descartadas: env (VITEST*, NODE_ENV, AI_AGENT, CLAUDECODE), vitest duplicado (`npm ls`: 1 instância), concorrência (6 paralelas). Falta só confirmar na sessão do orquestrador.

## Produtos (PRO)

- **2026-11-24** PRO-001: hook bloqueava `src/app/(app)/produtos/`. Escopo liberado; criado `actions.ts` e páginas completas. Evidência: src/app/(app)/produtos/actions.ts; lint, typecheck, `npx vitest run` (173 testes) e build ok.

## Mesclados

- **2026-11-24** "Orquestrador como agente principal... validar numa sessão real" foi mesclado em AGT-001 (mesma validação em sessão real). Origem: ver docs/pendencias/_registro-migracao.md.

- **DB-002** Requisições inseridas direto pelo cliente não atualizam estoque_atual. Resolvido em 2026-11-24: insert de `authenticated` removido de `requisicoes`/`requisicao_itens` (ADR 0001); evidência: `supabase/migrations/0001_schema.sql`, `tests/supabase/migracao-0001.test.ts` ("é só leitura para authenticated") e `tests/supabase/rls.dbtest.ts` ("não insere direto em").

- **BASE-005** npm run lint falhava com @theme em globals.css. Resolvido em 2026-11-24: `css.parser.tailwindDirectives: true` em biome.json; evidência: `npm run lint` sem erro em globals.css (scripts/gemini-assist.mjs useTemplate também corrigido).

## Lojas (LOJ)

- **2026-11-24** LOJ-001 (tela /lojas) criada. Evidência: src/app/(app)/lojas/; tests/modules/lojas/pagina.test.ts; build lista /lojas, /lojas/nova e /lojas/[id].

- **2026-11-24** AUT-002 e BASE-006: "Sair" era link para /login sem encerrar a sessão. Agora `<form action={sairAction}>` com botão em src/components/barra-inferior.tsx e no rodapé de src/components/menu-lateral.tsx; `sairAction` chama `sair()` (signOut + redirect /login). Evidência: lint, typecheck, testes e build ok. Validação com sessão real segue em AUT-001.
