# Estrutura de pastas

```
.claude/            # configuração do Claude Code (permissions.deny)
docs/               # documentação
  modulos/          # um doc por módulo
  adr/              # decisões de arquitetura
src/
  app/              # rotas e páginas (App Router); /health
  lib/              # utilitários (env.ts)
  modules/          # um subdiretório por módulo do SPEC
    autenticacao/ lojas/ produtos/ importacao/
    contagem/ requisicoes/ estoque/ historico/
  instrumentation.ts  # valida o ambiente ao iniciar o servidor
supabase/
  migrations/       # SQL versionado
tests/              # espelha src/
  fixtures/         # arquivos de apoio aos testes
```

Arquivos na raiz: CLAUDE.md, SPEC.md, PLAN.md, PENDENCIAS.md, package.json, tsconfig.json, biome.json, vitest.config.ts, next.config.mjs, postcss.config.mjs, .env.example, .nvmrc.
