# Gemini como assistente

`node scripts/gemini-assist.mjs <analise|testes|revisao|resumo> [--arquivos a.ts,b.ts] [--dry-run] "pergunta"` ou o comando `/gemini`. Serve para tarefas simples e baratas; a resposta é **opinião a conferir** (o script não grava nem executa nada).

## Chave (segredo)
- `GEMINI_API_KEY` fica só em `.env.local` (ignorado pelo Git e na lista `permissions.deny` do Claude; `.env.example` traz só o nome, sem valor). Crie a chave no Google AI Studio e cole no arquivo você mesmo; ela nunca entra em chat, código, log, argumento de comando nem arquivo de contexto.
- O script lê o arquivo por conta própria (o Claude não lê `.env*`) e envia a chave no cabeçalho `x-goog-api-key`, nunca na URL. Mensagens de erro não repetem o corpo da resposta.
- Não é `NEXT_PUBLIC_`: não vai ao navegador, e o app não a usa.

## O que sai da sua máquina
O texto da pergunta e dos arquivos citados vai para o Google. O script recusa `.env*`, chaves, `rag.db`, `node_modules`, arquivos fora do projeto e mais de 60 KB; também redige JWT, chaves, variáveis `*_KEY/SECRET/TOKEN/PASSWORD` e e-mails. Use `--dry-run` para ver exatamente o que seria enviado. Confira a política de dados do seu plano do Gemini (planos gratuitos costumam permitir uso do conteúdo para melhorar modelos): pendência HAR-006.

## Quando usar
Bom: opinião sobre um arquivo, ideias de casos de teste, segunda leitura de um diff pequeno, resumo de documento. Não usar: segurança, regra de saldo/transação, arquitetura, escrever o código final, ou qualquer dado de cliente.

Modelo: `GEMINI_MODEL` (padrão `gemini-flash-latest`); `--modelos` lista os disponíveis para a sua chave.
