# Squads externos

Pasta: `C:\Users\israe\OneDrive\Desktop\Projetos Israel\Sistemas\criador_site\squads` (fora do projeto; somente leitura).

Os squads usam um formato próprio (`squad.yaml` + `agents/*.agent.md`, rodados por um executor externo). O Claude Code não executa esse pipeline. Por isso o uso aqui é **consultivo**: o agent `consultor-squad` lê o prompt do especialista e responde nesse papel. Os prompts são genéricos e em inglês; o padrão do projeto (docs/padroes.md) vence em qualquer conflito.

## Quando consultar quem

| Situação | Squad / especialista | Arquivo |
|---|---|---|
| Revisar schema, RLS, índices, SQL | javascript-squad / database-engineer | @community/javascript-squad/agents/database-engineer.agent.md |
| Estratégia de testes Vitest, TDD | javascript-squad / test-engineer | .../test-engineer.agent.md |
| Tipagem, lint, refatoração | javascript-squad / code-quality-advisor | .../code-quality-advisor.agent.md |
| Deploy Vercel, CI | javascript-squad / devops-engineer | .../devops-engineer.agent.md |
| Decisão de arquitetura (módulos, server actions) | javascript-squad / fullstack-architect | .../fullstack-architect.agent.md |
| Next.js/React (componentes, RSC) | javascript-squad / react-specialist | .../react-specialist.agent.md |
| Fluxo de telas, usabilidade na loja | design-squad / ux-researcher, ui-designer | @community/design-squad/agents/ |
| Tokens e padrão visual | design-squad / design-system-architect | @community/design-squad/agents/design-system-architect.agent.md |
| Checar entrega com critério de sprint | design-executor / tech-lead, qa-engineer, code-reviewer | @viggo/design-executor/agents/ |

Ignorar: vue-specialist, flutter, delphi e go (stacks que não usamos) e frontend-design-squad (feito para gerar design, só útil se decidirmos redesenhar).

## Como usar

- "Use o consultor-squad: database-engineer do javascript-squad, revise a migração 0001 quanto a RLS."
- Para o agent primário: delegar ao consultor-squad antes de decisões de arquitetura ou depois de escrever o schema.
- Se quiser um squad **rodando de verdade** (pipeline completo), isso depende do executor que lê o squad.yaml; me diga qual é e eu integro.

## Limitações
- A pasta fica fora do projeto e do repositório: se mudar de máquina, o caminho quebra.
- Os squads com pasta `_memory` guardam memória própria; o consultor não grava nela.
