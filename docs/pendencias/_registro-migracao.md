# Registro da migração de PENDENCIAS.md (2026-11-24)

Formato antigo: lista simples com `[ ]`/`[x]`, sem módulo, prioridade nem data. Backup: docs/_backup/PENDENCIAS.md.original.

| Item original (início do texto) | Destino | Status |
|---|---|---|
| Pre-commit (simple-git-hooks + lint-staged)... | BASE-001 | aberto |
| SheetJS (importação, Sprint 2)... | IMP-001 | aberto |
| CSP ainda não configurada... | SEG-001 | aberto |
| `/ready` não criado | BASE-002 | aberto |
| CLAUDE.md: nomenclatura... "a definir" | BASE-003 | aberto |
| [x] Hooks de agents criados | docs/pendencias-resolvidas.md | resolvido |
| Hooks só testados com entrada simulada... | AGT-001 | mesclado com o item do orquestrador |
| Rules com `paths:`... subagents | AGT-004 | aberto |
| OpenCode não carrega rules por pasta... | HAR-003 | aberto |
| Hook global de PostToolUse não criado | AGT-005 | aberto |
| Plugin OpenCode não executado... | HAR-002 | aberto |
| [x] @code-reviewer criado | docs/pendencias-resolvidas.md | resolvido |
| Agents em .gemini/agents/ não verificados; Antigravity... | HAR-001 | aberto |
| Agents nunca foram executados numa task real | AGT-002 | aberto |
| Squads externos fora do projeto | AGT-007 | aberto |
| Orquestrador como agente principal... validar | AGT-001 | mesclado (com "hooks só testados") |
| Comandos nunca executados; /review pode colidir | AGT-003 | aberto |
| code-reviewer sem Bash; Gemini/Antigravity sem agente principal | HAR-001 (parte Gemini) + docs/agentes.md (parte do code-reviewer) | dividido: pendência e fato movido para doc |
| Orquestrador roda em Opus | AGT-006 | aberto |
| RAG: hooks só testados simulados... | RAG-001 | aberto |
| RAG: SessionEnd em vez de Stop; claude -p; onnxruntime | RAG-002, RAG-003; decisão SessionEnd já em docs/rag.md | dividido: 2 abertos e 1 fato movido para doc |
| RAG: rag.db no .gitignore; decidir .md no Git | RAG-004 | aberto |

Conta: os 20 abertos antigos = 17 itens com ID próprio (1 para 1) + 2 absorvidos por mesclagem (o do orquestrador entrou em AGT-001; a parte Gemini do item do code-reviewer entrou em HAR-001) + 1 dividido (RAG sobre SessionEnd/claude -p/onnxruntime gerou RAG-002 e RAG-003, com o fato SessionEnd movido para docs/rag.md; o fato do code-reviewer sem Bash já estava em docs/agentes.md). Resultado: 19 abertos na migração (HAR-004 e HAR-005 foram criados depois, no tópico 17; contagem atual no PENDENCIAS.md), 2 resolvidos (os mesmos 2 antigos [x]).
