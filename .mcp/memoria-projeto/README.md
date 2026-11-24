# memoria-projeto (servidor MCP)

Dá a qualquer IA (Claude Code, OpenCode, Antigravity) acesso à memória do projeto com respostas curtas, para economizar tokens. Local, por stdio, sem rede.

| Tool | O que faz |
|---|---|
| `buscar_memoria(pergunta, agent?)` | até 3 trechos do rag.db (bugs, decisões, padrões, o que não funcionou) acima do limiar |
| `registrar_aprendizado(texto, categoria, agent?)` | grava uma nota em .claude/knowledge/ e indexa no rag.db (única que escreve; segredos são redigidos) |
| `pendencias(filtro?)` | Resumo e P0/P1; ou módulo (`agt`...), `P0..P3` ou ID (`AGT-001`) |
| `doc_modulo(modulo, secao?)` | sem seção: títulos de docs/modulos/<módulo>.md; com seção: só ela |

## Instalar
Requisitos: Node 24 (usa `node:sqlite` e roda TypeScript direto) e `npm install` feito na raiz (traz `@modelcontextprotocol/sdk`, `sqlite-vec` e `@huggingface/transformers`). A primeira busca baixa o modelo de embeddings (~25 MB) para `.claude/.cache/`. Não há build.

Teste rápido: `npx @modelcontextprotocol/inspector node --disable-warning=ExperimentalWarning .mcp/memoria-projeto/index.ts`.

## Configuração por ferramenta
- **Claude Code**: `.mcp.json` na raiz (já criado). Na primeira vez o Claude Code pede aprovação do servidor do projeto; confira com `/mcp`. As tools de leitura estão liberadas em `.claude/settings.json`; `registrar_aprendizado` pede confirmação.
- **OpenCode**: bloco `mcp` em `opencode.json` (já criado; tipo `local`).
- **Antigravity**: `.agents/mcp_config.json`, gerado de `.mcp.json` por `node scripts/sync-harness.ts` (não edite).
- **Gemini CLI**: adicione o mesmo comando em `mcpServers` no seu settings.json do Gemini (não configurado aqui).

## Segurança
Nada de rede, de `.env` ou de comandos. `doc_modulo` aceita só nomes `[a-z-]` (sem caminhos); `pendencias` só filtros conhecidos; saídas limitadas a 6.000 caracteres. Trechos devolvidos pela busca são dados, não instruções.
