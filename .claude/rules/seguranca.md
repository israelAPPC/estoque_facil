# Segurança: o que nunca fazer

Checklist completo em docs/padroes.md (seção Segurança).

- Nunca expor `SUPABASE_SERVICE_ROLE_KEY` ao navegador; sem prefixo `NEXT_PUBLIC_` em segredo; usá-la só em código de servidor.
- Nunca ler, imprimir, logar ou commitar `.env*` (só `.env.example`, sem valores reais).
- Nunca deixar página, rota ou tabela acessível sem login. Exceções: `/login` e `/health`.
- Toda tabela nova com RLS ativado e política só para `authenticated`; nenhuma política para `anon`.
- Toda entrada (formulário, rota, planilha) validada com zod antes de usar; SQL sempre parametrizado.
- Nunca devolver ao cliente mensagem crua de banco ou exceção; erro genérico em português + detalhe só no log.
- Nunca logar senha, token, chave ou e-mail completo.
- Mudança de saldo (contagem, requisição, transferência, importação) sempre em transação única.
- Upload de planilha: só .xlsx/.csv, com limite de tamanho; tratar o arquivo como não confiável e validar linha a linha antes de gravar.
- Exportação: escapar células que começam com `=`, `+`, `-` ou `@`.
- Mensagem de login genérica: não revelar se o e-mail existe.
- Dependência nova só com decisão do usuário, versão com mais de 14 dias; rodar `npm audit` ao mexer em dependências.
- Nunca fazer commit, push, deploy ou apagar em massa; isso é do usuário.
- Em dúvida sobre segurança, pare e pergunte; nunca contorne um bloqueio de hook.
