# Autenticação

Login por e-mail e senha (Supabase Auth), logout e proteção de todas as rotas.

## Regras
- Toda página e rota exige sessão, exceto `/login` e `/health` (`decidirAcesso` em `src/modules/autenticacao/acesso.ts`). Logado em `/login` vai para `/`.
- Mensagem de erro única: "E-mail ou senha incorretos." (entrada inválida, senha errada ou falha inesperada); não revela se o e-mail existe.
- Entrada validada com zod (`esquemaLogin`).
- Cadastro público NÃO existe; criação de usuários é decisão em aberto.
- Chave de serviço só em `src/lib/supabase/admin.ts` (servidor); navegador usa só a chave pública.

## Arquivos
- `src/proxy.ts` e `src/lib/supabase/sessao-proxy.ts`: proteção e renovação do cookie.
- `src/lib/supabase/servidor.ts`, `navegador.ts`, `admin.ts`: clientes.
- `src/modules/autenticacao/`: `acesso.ts` (regra), `login.ts` (`entrar`), `sessao.ts` (`obterUsuario`, `sair`).
- `src/app/login/`: página, formulário e ações de servidor (`entrarAction`, `sairAction`).
- Testes: `tests/modules/autenticacao/`.

## Pendências
AUT-001 (validar com Supabase real). O "Sair" do menu (barra inferior e menu lateral) usa `sairAction` em um `<form>`.
