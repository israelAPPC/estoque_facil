# Agents do projeto

Fonte única: `.claude/agents/` (Claude Code). As pastas `.opencode/agents/` e `.gemini/agents/` são cópias adaptadas (frontmatter diferente, mesmo conteúdo). Ao mudar um agent, mude nas três.

| Agent | Módulo / Tasks do PLAN | Modelo | Tools | Skills |
|---|---|---|---|---|
| agent-db | Banco, Task 1.1 | Sonnet | leitura + escrita + Bash | migracao-supabase, regras-estoque, fechar-tarefa |
| agent-autenticacao | 2.1 | Sonnet | idem | ui-estoque, fechar-tarefa |
| agent-lojas | 2.2 | Sonnet | idem | ui-estoque, fechar-tarefa |
| agent-produtos | 1.2, 2.3 | Sonnet | idem | regras-estoque, ui-estoque, fechar-tarefa |
| agent-importacao | 5.1, 6.1–6.3 | Sonnet | idem | regras-estoque, ui-estoque, fechar-tarefa |
| agent-contagem | 1.4, 3.1 | Sonnet | idem | regras-estoque, ui-estoque, migracao-supabase, fechar-tarefa |
| agent-requisicoes | 3.2 | Sonnet | idem | regras-estoque, ui-estoque, migracao-supabase, fechar-tarefa |
| agent-estoque | 1.3, 3.3 | Sonnet | idem | regras-estoque, ui-estoque, fechar-tarefa |
| agent-historico | 5.2, 6.4 | Sonnet | idem | regras-estoque, ui-estoque, fechar-tarefa |
| agent-integracao | 4.1, 4.2 | Sonnet | idem | ui-estoque, fechar-tarefa, regras-estoque |
| orquestrador | **agente principal**: todo pedido passa por ele | Opus | Agent (só os agents do projeto), leitura, Edit/Write só em docs/, PENDENCIAS, PLAN, CLAUDE.md; Bash só verificações | nenhuma (lê sob demanda) |
| code-reviewer | revisão após cada task | Sonnet | só leitura (sem Bash) | regras-estoque, ui-estoque, migracao-supabase |
| story-validator | critérios de aceite | Haiku | só leitura | nenhuma |
| consultor-squad | opinião de especialistas externos | Sonnet | só leitura | nenhuma (ver docs/squads.md) |

Opus não foi atribuído a nenhum agent: a arquitetura é decidida na sessão principal (modelo que você escolher) com você. Se quiser, troque `model: sonnet` por `opus` em agent-db e agent-integracao.

## Como invocar manualmente

**Claude Code**
- Em linguagem natural: "Use o agent-produtos para fazer a Task 1.2".
- Por menção: `@agent-produtos faça a Task 1.2`.
- Ver e editar: comando `/agents`.

**OpenCode:** `@agent-produtos faça a Task 1.2` (subagents em `.opencode/agents/`).

**Gemini CLI:** `@agent-produtos faça a Task 1.2` (subagents em `.gemini/agents/`; recurso experimental, pode exigir ativar em `settings.json`).

**Antigravity:** não verifiquei o formato próprio de agents dele. Alternativa: pedir "leia `.claude/agents/agent-produtos.md` e siga como papel" na conversa.

## Orquestrador (agente principal)

`.claude/settings.json` tem `"agent": "orquestrador"`, então a sessão principal já roda como ele (no OpenCode, `default_agent` em `opencode.json`). Só ele chama os outros agents (subagents não chamam subagents); a lista permitida está no campo `tools` do frontmatter. Ele não escreve código: um hook (`.claude/hooks/orquestrador/guarda.mjs`) limita suas edições a docs/, PENDENCIAS.md, PLAN.md e CLAUDE.md e seu Bash a lint, tipos, testes, build e scripts de contexto. Também é o arquiteto: decisões estruturais viram ADR em docs/adr/; se a carga crescer, ele recomenda criar um agent-arquitetura (decisão sua). Para falar direto com um agent de módulo, use `@agent-produtos ...`. Para desligar o orquestrador, remova `"agent"` de settings.json.

Os modelos por agent são os do cabeçalho; o orquestrador pode sugerir Opus para uma chamada específica (saldo, transação, RLS) e justifica no plano. As skills de cada agent ficam no cabeçalho dele. Comandos de atalho: docs/comandos.md.

## Como o agent primário delega

Fluxo por task (feito pelo orquestrador):
1. Sessão principal lê a task no PLAN.md e chama o agent do módulo, passando o ID da task.
2. Quando ele devolve o resumo, chama **story-validator** (critérios de aceite). Reprovou: devolve ao agent do módulo; máximo de 3 rodadas, depois pergunta ao usuário.
3. Aprovado: chama **code-reviewer**. Itens bloqueantes voltam ao agent do módulo.
4. Tasks independentes (ex.: 1.2, 1.3, 1.4 da Fase 1) podem rodar em paralelo, cada uma no seu agent, pois mexem em pastas diferentes. Tasks que dependem do banco esperam a 1.1.
5. Dúvida de especialista (Postgres, testes, UX): chama **consultor-squad**.

Exemplo de pedido ao agente primário:
> "Execute a Fase 1 do PLAN.md: rode agent-db (1.1), agent-produtos (1.2), agent-estoque (1.3) e agent-contagem (1.4) em paralelo; depois story-validator e code-reviewer em cada uma."

Regras comuns a todos os agents de módulo: ler CLAUDE.md, docs/padroes.md e docs/modulos/<módulo>.md; TDD; não mexer fora da pasta do escopo; não editar SPEC/PLAN/CLAUDE.md; não fazer commit/push; fechar com a skill fechar-tarefa.
