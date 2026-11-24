<!-- GERADO por scripts/sync-harness.ts a partir de .claude/rules/frontend.md. Não edite aqui: edite a fonte e rode o script. -->

Aplica-se somente quando o trabalho envolver: src/app/**

# Frontend (páginas e componentes)

Skill ui-estoque tem o checklist de UI; aqui só as restrições.

- Componente de servidor por padrão; `"use client"` só onde há estado ou evento.
- Dados vêm do serviço do módulo (`src/modules/<modulo>`); página nunca chama o Supabase direto nem contém regra de negócio.
- Cliente do navegador usa só `NEXT_PUBLIC_SUPABASE_ANON_KEY`; nada de chave de serviço em arquivo cliente.
- Toda página exceto `/login` fica atrás da sessão (proteção em `src/proxy.ts`); não criar rota pública nova.
- Formulário: validar com o mesmo schema zod do servidor; mostrar erro em português ligado ao campo.
- Campos de quantidade: caixas + unidades, convertidos por `produtos/unidades.ts`; nunca `parseInt` solto.
- Ação que muda saldo pede confirmação e mostra o aviso de saldo negativo antes de gravar.
- Sem rolagem horizontal em 320px; alvos de toque de 44px.
