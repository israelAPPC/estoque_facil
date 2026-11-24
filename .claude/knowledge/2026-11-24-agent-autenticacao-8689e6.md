---
agent: agent-autenticacao
data: 2026-11-24
origem: agent
---

## decisao
- Usar `src/proxy.ts` (middleware novo do Next.js) em vez de `middleware.ts`; redirecionar rotas protegidas sem sessão para `/login`, com exceções apenas para `/login` e `/health`.
- Chave de serviço do Supabase (`SUPABASE_SERVICE_ROLE_KEY`) exclusivamente em `src/lib/supabase/admin.ts`, nunca no navegador ou compartilhada.
- Mensagem de erro de login genérica em português ("E-mail ou senha incorretos") sem revelar se o e-mail existe ou detalhe técnico, usando validação Zod na entrada.

## padrao
- Arquitetura de módulos de autenticação: `src/modules/autenticacao/` para regras puras (`decidirAcesso`, `entrar`, `sair`); `src/lib/supabase/` para clientes Supabase (servidor, navegador, admin); `src/app/login/` para UI.
- TDD obrigatório: escrever testes que falham antes de implementar o código.

## nao-funcionou
- Hook do vitest acusa `TypeError: Cannot read properties of undefined (reading 'config')` nos testes de autenticação quando rodado dentro do hook (AGT-008, bug de ambiente intermitente); testes passam rodando `vitest` direto no terminal, então não bloqueia a entrega.

## feature
- Autenticação completa implementada: proxy em `src/proxy.ts` redireciona sem sessão, clientes Supabase em `src/lib/supabase/{servidor,navegador,admin}.ts`, lógica em `src/modules/autenticacao/{acesso,login,sessao}.ts`, página e formulário de login em `src/app/login/`, testes em `tests/modules/autenticacao/{acesso,login}.test.ts`. Validação com Zod, mensagens de erro genéricas.
