---
description: Pede ao Gemini uma opinião barata (análise, testes, revisão, resumo) sobre arquivos sem segredos
agent: orquestrador
---

Peça uma opinião ao Gemini (tarefa simples e barata). Pedido: $ARGUMENTS

Formato do pedido: `<analise|testes|revisao|resumo> [arquivos separados por vírgula] "pergunta"`.

1. Use só para tarefas de baixa complexidade: análise de um arquivo, ideias de casos de teste, segunda opinião de revisão, resumo. **Não use** para decidir segurança, regra de saldo, arquitetura nem para escrever código final.
2. Escolha só os arquivos necessários. Nunca envie .env*, chaves, rag.db nem dados de clientes (o script recusa e redige segredos, mas confira). O conteúdo sai da máquina para o Google.
3. Rode `node scripts/gemini-assist.mjs <tarefa> --arquivos <a,b> "<pergunta>"`. Se quiser ver antes o que seria enviado, acrescente `--dry-run`.
4. Se faltar a chave, diga ao usuário para colocar GEMINI_API_KEY em .env.local (você nunca lê esse arquivo).
5. Apresente a resposta como OPINIÃO do Gemini: confira no código antes de aceitar e, se virar ação, delegue ao agent do módulo. Não aplique nada automaticamente.
