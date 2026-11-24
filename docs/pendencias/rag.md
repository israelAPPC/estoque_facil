# Pendências: Memória (rag.db) (RAG)

Texto completo dos itens abertos. Resumo e P0/P1 em PENDENCIAS.md.

<a id="rag-001"></a>
### RAG-001: Validar o RAG numa sessão real e calibrar a busca em português.

**P2 · VALIDAR** · origem: 2026-11-24

Os hooks UserPromptSubmit, SubagentStop e SessionEnd foram testados só com entrada simulada e transcript sintético. Validar numa sessão real: campo `agent_transcript_path` do SubagentStop, latência a cada prompt e qualidade da busca em português com o all-MiniLM-L6-v2 (calibrar `limiarSimilaridade` em .claude/scripts/rag.config.json ou trocar por modelo multilíngue).

<a id="rag-002"></a>
### RAG-002: Garantir que o claude -p seja encontrado pelo summarize.ts (CLAUDE_BIN).

**P2 · DÉBITO** · origem: 2026-11-24

O summarize.ts usa `claude -p`; o executável precisa estar acessível (PATH, %APPDATA%\npm\claude.cmd ou variável CLAUDE_BIN). Fora desses caminhos, a captura de aprendizados falha em silêncio.

<a id="rag-004"></a>
### RAG-004: Decidir se os .md de .claude/knowledge entram no Git (o rag.db já está ignorado).

**P2 · DECISÃO** · origem: 2026-11-24

O rag.db está no .gitignore (reconstruível com `node .claude/scripts/embed.ts --reindexar`). Decidir se os arquivos .claude/knowledge/*.md, que são a fonte, entram no Git. Podem conter descrições de bugs do projeto (sem segredos, que são removidos na captura).

<a id="rag-003"></a>
### RAG-003: Revisar o postinstall não aprovado do onnxruntime-node.

**P3 · DÉBITO** · origem: 2026-11-24

O onnxruntime-node tem postinstall não aprovado (`npm approve-scripts`); o RAG funcionou sem ele. Decidir se aprova ou mantém bloqueado.
