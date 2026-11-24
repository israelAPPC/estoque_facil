# Slash commands

Fonte: `.claude/commands/` (Claude Code) e `.opencode/commands/` (OpenCode), com o mesmo conteúdo. Todos rodam pelo orquestrador. Ao mudar um, mude nos dois (a fonte de geração está fora do projeto; edite os dois arquivos à mão).

| Comando | O que faz |
|---|---|
| `/review [task]` | @code-reviewer contra SPEC.md e PLAN.md; BLOQUEANTE / IMPORTANTE / SUGESTÃO |
| `/implementar [task]` | lê a task no PLAN.md, delega ao agent certo com TDD, depois story-validator e code-reviewer |
| `/entrega` | hooks de encerramento, lint/tipos/testes/build, checkboxes do PLAN.md, auditoria de contexto, próximos passos |
| `/analisa-bug [descrição]` | causa raiz e solução proposta; sugere /corrigir-bug |
| `/corrigir-bug [plano]` | correção via agent (teste de regressão primeiro); registra em docs/CHANGELOG.md e no rag.db |
| `/melhoria [descrição]` | plano, delegação, atualiza docs/modulos/ e CHANGELOG |
| `/nova-feature [descrição]` | perguntas, plano em sprints/fases/tasks, e ao final docs/modulos/<módulo>.md + docs/uso/<feature>.md |
| `/deploy` | code-reviewer; bloqueantes acionam /analisa-bug e /corrigir-bug; ao final só sinaliza (você publica) |
| `/auditar-contexto` | mede CLAUDE.md, rules e docs/modulos com `.claude/hooks/orcamento-contexto/medir.mjs`; só propõe o que mover |

Observações
- `/review` pode coincidir com um comando embutido do Claude Code; se o embutido abrir no lugar do nosso, use `/project:review` ou renomeie o arquivo.
- Orçamento de contexto: CLAUDE.md ~10 KB, rules incondicionais ~3k tokens, rule até 30 linhas (valores em `.claude/hooks/orcamento-contexto/limites.mjs`; o hook de Stop avisa).
- O `rag.db` ainda não existe no projeto: /corrigir-bug avisa e anota em PENDENCIAS.md enquanto não houver.
