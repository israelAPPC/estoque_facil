<!-- GERADO por scripts/sync-harness.ts a partir de .claude/rules/servicos-e-lib.md. Não edite aqui: edite a fonte e rode o script. -->

Aplica-se somente quando o trabalho envolver: src/modules/**, src/lib/**

# Serviços, repositórios e lib (backend)

- Estrutura de cada módulo: serviço (regra) → repositório (único lugar que importa o cliente Supabase). Regra pura (conversão, comparação, saldo) não importa Supabase nem `process.env`.
- Funções puras recebem dados e devolvem dados: sem `Date.now()` ou `new Date()` interno; a data entra por parâmetro (testável).
- Erros de regra são classes tipadas (ex.: `FatorInvalidoError`), nunca `throw new Error("texto")`.
- Operação que muda saldo chama função SQL/transação do `supabase/`; nunca duas chamadas soltas do cliente.
- Entrada externa passa por schema zod na borda (rota/ação); dentro do módulo os tipos já são confiáveis.
- Variáveis de ambiente só via `src/lib/env.ts` (`validarEnv`), nunca `process.env` direto.
- Não devolver linha crua do banco à tela: mapear para tipo do domínio (quantidades em unidades).
- Listagens com paginação e limite máximo.
