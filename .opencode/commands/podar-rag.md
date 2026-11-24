---
description: Poda o rag.db (duplicados e obsoletos); simula primeiro e só aplica com sua aprovação
agent: orquestrador
---

Poda do rag.db (memória do projeto).

1. Rode `node .claude/scripts/prune.ts` (simulação: lista chunks obsoletos e duplicados que seriam removidos; nada é apagado). Rode também `node .claude/scripts/prune.ts --listar` se precisar conferir o conteúdo.
2. Mostre ao usuário o que seria removido e por quê. Pergunte (múltipla escolha): aplicar tudo, marcar algum chunk como obsoleto antes (`--marcar-obsoleto <id>`) ou cancelar.
3. Só com aprovação, rode `node .claude/scripts/prune.ts --aplicar` e reporte quantos chunks sobraram. Os arquivos .md em .claude/knowledge/ não são apagados.

Regras: nunca apague sem aprovação; nunca faça commit, push ou deploy.
