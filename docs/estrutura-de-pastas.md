# Estrutura de pastas

```
.claude/            # configuração do Claude Code (permissions.deny)
docs/               # documentação
  modulos/          # um doc por módulo
  adr/              # decisões de arquitetura
src/
  app/              # rotas e páginas (App Router); /health
    (app)/          # route group das áreas logadas (layout com menu lateral); páginas dos módulos entram aqui
  components/       # componentes compartilhados: menu-lateral (desktop), barra-inferior (celular), navegacao.ts, ui/ (Botao, Campo, Aviso)
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
