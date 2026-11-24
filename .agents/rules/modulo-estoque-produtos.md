---
trigger: glob
globs: "src/modules/estoque/**, src/modules/produtos/**, tests/modules/estoque/**, tests/modules/produtos/**"
---
<!-- GERADO por scripts/sync-harness.ts a partir de .claude/rules/modulo-estoque-produtos.md. Não edite aqui: edite a fonte e rode o script. -->
# Módulos estoque e produtos

Leia docs/modulos/estoque.md e docs/modulos/produtos.md.

- `calcularSaldo(base, movimentos)` é função pura: contagem-base + movimentos de data posterior à base.
- Conversão só em `produtos/unidades.ts` (`paraUnidades`, `paraCaixas`); nenhuma outra conta de caixa em lugar nenhum.
- Fator inválido (zero, negativo, não inteiro) lança erro tipado; produto sem caixa tem fator 1.
- SKU único e normalizado (trim, sem diferença de maiúscula).
- Visão geral compara lojas lado a lado e mostra a data da última contagem de cada uma.
- Produto com histórico não é apagado; excluir x desativar é decisão em aberto.
