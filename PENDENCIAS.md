# Pendências

Só itens ABERTOS. Texto completo em docs/pendencias/<módulo>.md (âncora = ID em minúsculas); resolvidos em docs/pendencias-resolvidas.md; roteiro de validação em docs/validacoes-banco-real.md. Regras: .claude/rules/pendencias.md.

Prioridades: P0 risco de dados ou segurança · P1 comportamento incorreto confirmado, validação que bloqueia confiança ou decisão que bloqueia · P2 débito sem risco de dados, testes faltando, melhorias · P3 ideias.
Tipos: VALIDAR · DECISÃO · BUG · DÉBITO · TESTE · FEATURE · IDEIA · VERIFICAR.

## Resumo

Abertos: 24 (P0: 0 · P1: 3 · P2: 15 · P3: 6)

| Módulo | Prefixo | P0 | P1 | P2 | P3 | Total | Detalhe |
|---|---|---|---|---|---|---|---|
| Base e convenções | BASE | 0 | 0 | 3 | 1 | 4 | [docs/pendencias/base.md](docs/pendencias/base.md) |
| Segurança | SEG | 0 | 1 | 0 | 0 | 1 | [docs/pendencias/seg.md](docs/pendencias/seg.md) |
| Importação | IMP | 0 | 0 | 1 | 0 | 1 | [docs/pendencias/imp.md](docs/pendencias/imp.md) |
| Agents, hooks e comandos | AGT | 0 | 2 | 3 | 2 | 7 | [docs/pendencias/agt.md](docs/pendencias/agt.md) |
| Outros harnesses (OpenCode, Gemini, Antigravity) | HAR | 0 | 0 | 5 | 2 | 7 | [docs/pendencias/har.md](docs/pendencias/har.md) |
| Memória (rag.db) | RAG | 0 | 0 | 3 | 1 | 4 | [docs/pendencias/rag.md](docs/pendencias/rag.md) |

## P0 e P1 por módulo

### Segurança (SEG)

- [ ] **P1 · FEATURE · SEG-001** Configurar CSP (Content-Security-Policy) em next.config.mjs antes de publicar. (origem: 2026-11-24)

Detalhe: [docs/pendencias/seg.md](docs/pendencias/seg.md)

### Agents, hooks e comandos (AGT)

- [ ] **P1 · VALIDAR · AGT-001** Validar hooks e orquestrador como agente principal numa sessão real do Claude Code. (origem: 2026-11-24)
- [ ] **P1 · VALIDAR · AGT-002** Rodar a primeira task real com agents e ajustar os prompts após a primeira Fase. (origem: 2026-11-24)

Detalhe: [docs/pendencias/agt.md](docs/pendencias/agt.md)
