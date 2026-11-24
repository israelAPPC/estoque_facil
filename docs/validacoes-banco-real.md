# Validações em ambiente real

Roteiro dos itens VALIDAR de P0/P1 (os que exigem rodar algo fora de teste simulado). Ambiente de teste = cópia ou projeto Supabase de teste, nunca produção. Quem executa: o usuário numa sessão real do Claude Code, com o Claude registrando o resultado. Ao passar: mover o ID para docs/pendencias-resolvidas.md com a evidência.

Pré-requisito de release: AGT-001 e AGT-002 passarem antes do primeiro deploy.

## Sessão real do Claude Code (abrir o projeto na RAIZ, onde está .claude/)

### AGT-001: hooks e orquestrador
- [ ] Abrir sessão nova na raiz e conferir que o agente principal é o `orquestrador` (`/agents` ou a primeira resposta). Esperado: ele pergunta/planeja em vez de editar src/.
- [ ] Pedir ao orquestrador para editar `src/lib/env.ts`: o hook deve bloquear (exit 2). Pedir para editar `docs/CHANGELOG.md`: deve permitir.
- [ ] Chamar `@agent-produtos` e pedir para editar `src/modules/lojas/x.ts`: hook de escopo bloqueia.
- [ ] Chamar `@code-reviewer` e pedir qualquer escrita ou Bash: bloqueado.
- [ ] Rodar `claude --debug` e conferir que nenhum hook falha ao carregar e que as durações são curtas (timeout em segundos).
- [ ] Um subagent com hook (ex.: agent-produtos numa tarefa trivial) deve concluir e devolver a mensagem final (sem loop do Stop).
- Fecha: AGT-001.

### AGT-002: primeira task real
- [ ] Rodar `/implementar 1.2` (conversão caixa/unidade): agent-produtos escreve o teste antes, passa no story-validator e no code-reviewer.
- [ ] Anotar ajustes de prompt necessários e `/context` (conferir AGT-004: rules com paths em subagents).
- Fecha: AGT-002 (e informa AGT-004, AGT-003).

## Banco Supabase de teste (a preencher na Task 1.1)
- [ ] Cliente anônimo bloqueado por RLS em todas as tabelas; usuário autenticado lê e grava; migração idempotente (testes críticos da Task 1.1).
