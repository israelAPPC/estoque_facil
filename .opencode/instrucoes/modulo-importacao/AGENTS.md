<!-- GERADO por scripts/sync-harness.ts a partir de .claude/rules/modulo-importacao.md. Não edite aqui: edite a fonte e rode o script. -->

Aplica-se somente quando o trabalho envolver: src/modules/importacao/**, src/app/importar/**, tests/modules/importacao/**

# Módulo importação

Leia docs/modulos/importacao.md. Colunas da planilha e reimportação de estoque inicial são decisões em aberto: pergunte antes de fixar.

- SheetJS: versão oficial do site da SheetJS, conferida por data (o `xlsx` do npm está desatualizado); instalação é decisão do usuário.
- Arquivo é não confiável: só .xlsx/.csv, tamanho máximo, sem fórmulas avaliadas, sem macros.
- Validar linha a linha com zod; devolver relatório das inválidas (linha e motivo). Se houver erro, não gravar nada parcial.
- Importar produto não duplica: SKU existente atualiza ou é rejeitado conforme a decisão do usuário.
- Estoque inicial e históricos gravam via `confirmarContagem` e serviços de requisição; nada de insert direto nas tabelas.
- Quantidades da planilha convertidas para unidades antes de gravar.
