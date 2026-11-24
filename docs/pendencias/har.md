# Pendências: Outros harnesses (OpenCode, Gemini, Antigravity) (HAR)

Texto completo dos itens abertos. Resumo e P0/P1 em PENDENCIAS.md.

<a id="har-001"></a>
### HAR-001: Abrir o projeto no Antigravity real e validar GEMINI.md, .agents/ e o hook gerados.

**P2 · VALIDAR** · origem: 2026-11-24

Os formatos do Antigravity foram tirados da documentação oficial (antigravity.google/docs: rules, skills, subagents, hooks, mcp), mas nada foi executado nele. Validar numa sessão real: que o `orquestrador` (mainAgent) aparece como agente principal; que as rules (trigger always_on e glob) e skills carregam; que os agents abrem sem travar (nomes de tools em `tools` errados podem travar o subagente); que `.agents/hooks.json` roda `scripts/antigravity-hook.mjs` e que o formato de resposta {decision, reason} bloqueia de fato (exit code não documentado). Gerado por scripts/sync-harness.ts.

<a id="har-002"></a>
### HAR-002: Executar o plugin do OpenCode e conferir default_agent e permission.task.

**P2 · VALIDAR** · origem: 2026-11-24

O plugin `.opencode/plugin/agent-hooks.ts` nunca foi executado e não tem escopo por agent. Também não foram verificados `default_agent` (opencode.json) e `permission.task` do orquestrador.

<a id="har-004"></a>
### HAR-004: Portar para o Antigravity os hooks por agent e a memória do RAG (hoje só há proteção global).

**P2 · DÉBITO** · origem: 2026-11-24

No Antigravity só há o hook global scripts/antigravity-hook.mjs (comandos proibidos e arquivos protegidos). A memória do rag.db (busca e registro) já está disponível a todos pelo MCP memoria-projeto (.mcp/memoria-projeto/), sem hook. Faltam: escopo por agent (o hook não sabe qual agent chama), teste após edição, orçamento de contexto e captura e injeção automáticas do rag.db (hoje o agente precisa chamar as tools do MCP por conta própria). O Antigravity suporta SessionStart, PostInvocation e Stop em .agents/hooks.json, então é viável portar.

<a id="har-006"></a>
### HAR-006: Testar o gemini-assist com a chave real e conferir modelo padrão e política de dados.

**P2 · VALIDAR** · origem: 2026-11-24

scripts/gemini-assist.mjs foi testado só sem chave e em dry-run. Depois de colocar GEMINI_API_KEY em .env.local: rodar `node scripts/gemini-assist.mjs --modelos` e confirmar que o padrão `gemini-flash-latest` existe (senão definir GEMINI_MODEL); fazer uma chamada real com um arquivo sem segredo; conferir nos termos do plano da sua conta do Gemini se o conteúdo enviado pode ser usado para treinar modelos (no plano gratuito, normalmente pode), e só então usar com código do projeto.

<a id="har-007"></a>
### HAR-007: Validar o MCP memoria-projeto no Claude Code, OpenCode e Antigravity reais.

**P2 · VALIDAR** · origem: 2026-11-24

O servidor .mcp/memoria-projeto/index.ts foi testado com um cliente MCP de teste (4 tools OK), mas não nas ferramentas reais. Conferir: Claude Code pede aprovação do .mcp.json e `/mcp` mostra as 4 tools; OpenCode aceita o bloco `mcp` (type local) de opencode.json; Antigravity lê .agents/mcp_config.json (gerado do .mcp.json). Gemini CLI não foi configurado.

<a id="har-003"></a>
### HAR-003: OpenCode carrega todas as instruções por pasta sempre; reduzir a lista se pesar.

**P3 · DÉBITO** · origem: 2026-11-24

O OpenCode não carrega rules por pasta: `.opencode/instrucoes/*/AGENTS.md` (gerados de .claude/rules/) entram todos sempre. Se pesar, reduzir a lista em opencode.json. Ao mudar uma rule, regerar a cópia.

<a id="har-005"></a>
### HAR-005: Verificar nomes de tools e modelos dos agents em .gemini/agents (Gemini CLI).

**P3 · DÉBITO** · origem: 2026-11-24

Os arquivos de .gemini/agents/ (Gemini CLI, recurso experimental) usam nomes de tools (read_file, replace, run_shell_command...) e modelos (gemini-2.5-*) não verificados na documentação do Gemini CLI. Não afeta o Antigravity, que usa .agents/.
