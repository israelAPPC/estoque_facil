# Memória do projeto (rag.db)

Existe para o CLAUDE.md ficar pequeno. Cada camada tem um papel:

| Camada | Papel | Quando é lida |
|---|---|---|
| CLAUDE.md | regras permanentes + índice | sempre |
| docs/modulos/ | estado atual de cada módulo | sob demanda |
| rag.db | bugs, decisões, "o que não funcionou", features (busca por similaridade) | até 3 trechos por prompt |
| docs/CHANGELOG.md | histórico datado | quase nunca |

## Como funciona
- **Fonte da verdade**: arquivos `.claude/knowledge/AAAA-MM-DD-agent-slug.md` (versionáveis). `rag.db` (SQLite + sqlite-vec, na raiz) é só índice, ignorado pelo Git e reconstruível: `node .claude/scripts/embed.ts --reindexar`.
- **Categorias**: `bug` (causa raiz), `decisao` (e o porquê), `padrao`, `nao-funcionou` e `feature` (como foi feito; extra pedido por você).
- **Captura** (em segundo plano; o hook sai na hora): `SubagentStop` resume o aprendizado do agent que terminou; `SessionEnd` resume a sessão. O resumo usa `claude -p --model haiku` sem ferramentas, rodando fora do projeto, e só grava se a conversa tiver conteúdo (≥1.500 caracteres). Segredos, chaves e e-mails são removidos antes de enviar ao modelo e antes de gravar.
- **Injeção** (`UserPromptSubmit`): busca por similaridade; máx. 3 chunks de até 600 caracteres (~150 tokens); só acima do limiar (`limiarSimilaridade` em `.claude/scripts/rag.config.json`, hoje 0,45); senão não injeta nada. Pula saudações, prompts com menos de 20 caracteres e slash commands curtos. Bônus pequeno para o mesmo agent e para categorias afins ao agent (tabela `afinidadeCategoria` na config). Erro em qualquer etapa: não injeta e não trava.
- **Poda**: `/podar-rag` (simula; remove só com sua aprovação) duplicados (similaridade ≥ 0,95, mantém o mais novo) e obsoletos (`prune.ts --marcar-obsoleto <id>`).

## Scripts (`node .claude/scripts/<x>.ts`, Node 24)
`summarize.ts` (transcript → .md), `embed.ts` (.md ou `--nota` → rag.db), `search.ts` ("pergunta"), `prune.ts`, `hook.ts` (ponto de entrada dos hooks), `lib.ts`, `rag.config.json`.

## Dependências (devDependencies, versões fixas, conferidas com mais de 14 dias e `npm audit` limpo)
`sqlite-vec@0.1.9`, `@huggingface/transformers@4.3.2`. O modelo all-MiniLM-L6-v2 (quantizado, ~25 MB) é baixado na primeira execução para `.claude/.cache/modelos/` (ignorado pelo Git). O SQLite é o `node:sqlite` do Node 24.

## Limites conhecidos
- all-MiniLM-L6-v2 é treinado principalmente em inglês: a similaridade em português é mais fraca. Se faltarem acertos, baixe o limiar (0,35–0,40) ou troque `modelo` na config por um multilíngue (reindexar depois).
- `UserPromptSubmit` carrega o modelo a cada prompt (~0,5 s com o cache aquecido; só se o banco tiver chunks).
- Só Claude Code tem hooks de captura/injeção; no OpenCode use `search.ts` e `embed.ts --nota` manualmente.
