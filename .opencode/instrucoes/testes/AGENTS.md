<!-- GERADO por scripts/sync-harness.ts a partir de .claude/rules/testes.md. Não edite aqui: edite a fonte e rode o script. -->

Aplica-se somente quando o trabalho envolver: tests/**

# Testes

- Vitest; arquivos `*.test.ts`; `tests/` espelha `src/` (ex.: `tests/modules/produtos/unidades.test.ts`).
- Nome do teste descreve o comportamento em português: "converte 3 caixas + 10 un com fator 24 em 82".
- Teste de regra de negócio usa função pura e dados em memória; sem rede, sem Supabase real, sem relógio real.
- Só `tests/supabase/` fala com banco, e apenas com o projeto de teste/local, nunca o de produção.
- Cobrir o caminho feliz e ao menos um erro; para as regras críticas do CLAUDE.md cobrir também o limite (zero, negativo, saldo negativo, origem = destino).
- Bug corrigido = teste de regressão escrito antes e visto falhando.
- Proibido `.skip`, `.only` ou teste sem asserção; teste que falha não é apagado nem enfraquecido para passar.
- Dados de teste fixos e pequenos; não ler `.env`.
