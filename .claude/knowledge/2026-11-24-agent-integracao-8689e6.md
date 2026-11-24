---
agent: agent-integracao
data: 2026-11-24
origem: agent
---

## feature
- "Sair" implementado como `<form action={sairAction}>` com `<button>` em `src/components/barra-inferior.tsx` (mobile) e `src/components/menu-lateral.tsx` (desktop); `sairAction` em `src/app/login/actions.ts` chama `sair()` (signOut + redirecionamento para /login).

## decisao
- Usar Server Action (`form action`) para logout em vez de Link garante execução real de `sair()` no servidor, não apenas navegação cliente.

## padrao
- Botões "Sair" com `min-h-11` (toque >= 44px), foco visível, estilo discreto; sem dependência nova.

## nao-funcionou
- Redirecionamento `/estoque → /login` após logout não foi testado em navegador; depende da verificação de que `signOut` limpa o cookie no proxy.
