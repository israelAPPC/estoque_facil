---
name: fechar-tarefa
description: Fecha uma feature ou correção seguindo a Definition of Done. Use ao concluir qualquer tarefa, antes de dizer que terminou.
---
<!-- GERADO por scripts/sync-harness.ts a partir de .claude/skills/fechar-tarefa/SKILL.md. Não edite aqui: edite a fonte e rode o script. -->
# Fechar tarefa

Definition of Done completa em `docs/padroes.md`.

## Quando usar
- Ao terminar uma task do PLAN.md, uma feature ou uma correção de bug.

## Passos
1. Rodar `npm run lint`, `npm run typecheck` e `npm test`. Se mexeu em rota ou página, rodar também `npm run build`. Corrigir antes de seguir.
2. Correção de bug: confirmar que existe teste de regressão escrito antes da correção.
3. Atualizar `docs/modulos/<modulo>.md` com o estado atual do módulo (não o histórico).
4. Registrar a mudança em `docs/CHANGELOG.md`; se houve decisão relevante, criar ADR a partir de `docs/adr/0000-template.md`.
5. Registrar em `PENDENCIAS.md` tudo que ficou pendente, adiado, mockado ou virou débito técnico.
6. Se uma decisão em aberto foi resolvida, atualizar `docs/decisoes-em-aberto.md`.
7. Não editar o CLAUDE.md, exceto se o índice de módulos ou as regras gerais mudaram.
8. Se o PLAN.md tem a sprint inteira concluída, mover a sprint para `docs/plan-arquivo.md`.
9. Dizer ao usuário o que foi feito e o que foi verificado, incluindo o que falhou ou foi pulado.

## Exemplo de saída
```
Concluído: Task 1.2 (conversão caixa/unidade).
Verificado: lint ok, tipos ok, 6 testes passando.
Atualizado: docs/modulos/produtos.md, docs/CHANGELOG.md.
Pendências novas: nenhuma.
```

## Quando NÃO usar
- Perguntas, explicações ou pesquisa que não alteraram código.
- Trabalho no meio de uma task: use só ao concluir.
