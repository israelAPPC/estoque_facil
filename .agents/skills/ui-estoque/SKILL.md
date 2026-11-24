---
name: ui-estoque
description: Padrões de interface (Tailwind, responsivo, WCAG AA) para telas do sistema. Use ao criar ou alterar páginas e componentes em src/app.
---
<!-- GERADO por scripts/sync-harness.ts a partir de .claude/skills/ui-estoque/SKILL.md. Não edite aqui: edite a fonte e rode o script. -->
# UI do estoque

Base: Tailwind 4 (configuração pelo CSS em `src/app/globals.css`). Adaptado do design system e da skill de acessibilidade do harness-architect, em versão enxuta.

## Quando usar
- Criar ou alterar página, formulário, tabela ou componente.

## Regras
1. **Responsivo:** pensar primeiro no celular (contagem é feita na loja) e depois no desktop; sem rolagem horizontal em 320px. Tabelas largas viram cartões ou rolam dentro do próprio contêiner.
2. **Tokens, não valores soltos:** cores e espaçamentos pelo tema do Tailwind (variáveis em `globals.css`); evitar cores hexadecimais espalhadas. Escala de espaçamento de 4px.
3. **Contraste:** texto com pelo menos 4.5:1 (texto grande 3:1). Status nunca só por cor: usar ícone ou texto junto (ex.: "Abaixo do mínimo" + cor).
4. **Toque e teclado:** alvos de toque com pelo menos 44x44px; foco visível; tudo operável por Tab e Enter; ESC fecha modal.
5. **Formulários:** todo campo com `<label>`; erro ligado ao campo por `aria-describedby` e com mensagem clara em português; botão de salvar sempre no mesmo lugar.
6. **Quantidades:** exibir em "X cx + Y un" quando o produto tem caixa; campos de entrada separados para caixas e unidades, convertidos pelas funções de `produtos/unidades.ts`.
7. **Feedback:** mostrar estado de carregamento, sucesso e erro; ação destrutiva pede confirmação; saldo negativo mostra aviso antes de gravar.
8. Textos da interface em português do Brasil ("Contagem", "Requisição", "Loja", não termos técnicos).

## Exemplo
Campo de contagem: `<label>` "Caixas" + `<label>` "Unidades" lado a lado, `inputMode="numeric"`, altura mínima 44px, erro "Informe um número inteiro maior ou igual a 0" ligado ao campo.

## Quando NÃO usar
- Regras de negócio, banco de dados ou testes sem tela envolvida.
- Redesenho completo ou nova identidade visual: peça decisão ao usuário antes.
