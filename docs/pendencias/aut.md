# Pendências: Autenticação (AUT)

Texto completo dos itens abertos. Resumo e P0/P1 em PENDENCIAS.md.

<a id="aut-001"></a>
### AUT-001: Validar login, logout e redirecionamento do proxy com um usuário real do Supabase.

**P2 · VALIDAR** · origem: 2026-11-24

Os testes cobrem as regras puras (`decidirAcesso`, `entrar`) com cliente falso; o fluxo com cookies e Supabase real só se confirma rodando `npm run dev`: sem sessão em `/` vai para `/login`; senha errada mostra "E-mail ou senha incorretos."; login correto vai para `/`; `/health` abre sem login.
