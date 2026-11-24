# EstoqueFácil (Gemini CLI e Antigravity)

Sistema web interno de estoque de várias lojas (contagens, requisições, transferências). Este arquivo é só um índice: a fonte única é docs/ + rag.db; nada daqui é cópia do CLAUDE.md.

## Antes de mexer
- Leia o doc do módulo (índice abaixo) antes de editar; padrões e Definition of Done em docs/padroes.md.
- Rules: .agents/rules/ (geradas de .claude/rules/; segurança e pendências sempre ativas). Skills: .agents/skills/. Agents: .agents/agents/ (o `orquestrador` é o agente principal: toda solicitação passa por ele).
- Decisão em aberto: docs/decisoes-em-aberto.md. Não invente; pergunte.

## Memória compartilhada (mesma do Claude)
- Preferir as tools do MCP `memoria-projeto` (.agents/mcp_config.json): `buscar_memoria`, `registrar_aprendizado`, `pendencias`, `doc_modulo`.
- Sem MCP: antes de investigar bug ou decisão, `node .claude/scripts/search.ts "<pergunta>"`.
- Sem MCP, ao concluir bug, feature ou decisão: `node .claude/scripts/embed.ts --nota "<texto sem segredos>" --categoria bug|decisao|padrao|nao-funcionou|feature --agent gemini`.
- Histórico datado: docs/CHANGELOG.md. Pendências: PENDENCIAS.md (regra em .agents/rules/pendencias.md).
- Ao concluir: atualizar o doc do módulo; este GEMINI.md só muda se o índice ou as regras gerais mudarem.

## Manter os harnesses em sincronia
Regras, agents e skills nascem em .claude/. Mudou algo? Edite lá e rode `node scripts/sync-harness.ts` (ele gera .agents/, .opencode/, .gemini/ e o índice abaixo). Não edite .agents/ direto: `node scripts/sync-harness.ts --check` aponta o que divergiu.

## Índice de módulos (leia o doc antes de mexer)
<!-- INDICE:INICIO (gerado de CLAUDE.md por scripts/sync-harness.ts; não edite) -->
- Autenticação → docs/modulos/autenticacao.md — login, proteção de rotas
- Lojas → docs/modulos/lojas.md — cadastro de lojas
- Produtos → docs/modulos/produtos.md — cadastro, SKU, fator caixa→unidade
- Importação → docs/modulos/importacao.md — planilhas de produtos e estoque inicial
- Contagem → docs/modulos/contagem.md — contagem por loja/data, rascunho, comparação
- Requisições → docs/modulos/requisicoes.md — consumo, transferência, recálculo de saldo
- Estoque → docs/modulos/estoque.md — consulta geral e por loja
- Histórico → docs/modulos/historico.md — contagens, requisições, exportação Excel/CSV
- Padrões de engenharia, segurança e Definition of Done → docs/padroes.md
- Memória (bugs, decisões, o que não funcionou) → rag.db, busca automática; ver docs/rag.md
- Rules (segurança e convenções sempre ativas; as demais carregam por pasta) → .claude/rules/
<!-- INDICE:FIM -->
