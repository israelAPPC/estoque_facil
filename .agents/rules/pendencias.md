---
trigger: always_on
---
<!-- GERADO por scripts/sync-harness.ts a partir de .claude/rules/pendencias.md. Não edite aqui: edite a fonte e rode o script. -->
# Pendências

PENDENCIAS.md (raiz) é só o índice dos itens ABERTOS; texto completo em docs/pendencias/<módulo>.md.

- Item: `- [ ] **P1 · TIPO · ID** Título curto e completo. (origem: AAAA-MM-DD)`. P2 e P3 só no arquivo de detalhe.
- Prioridades: P0 risco de dados ou segurança; P1 comportamento incorreto confirmado, validação ou decisão que bloqueia; P2 débito sem risco de dados, testes faltando; P3 ideias.
- Tipos: VALIDAR · DECISÃO · BUG · DÉBITO · TESTE · FEATURE · IDEIA · VERIFICAR.
- ID estável por módulo (SEG-001, AGT-002), nunca reutilizado. Prefixos: BASE, SEG, IMP, AGT, HAR, RAG; módulo novo ganha prefixo novo.
- Antes de criar, procure duplicata no módulo. Título curto e COMPLETO (até ~100 caracteres), nunca truncado.
- Ao criar: linha no PENDENCIAS.md (se P0/P1), texto no arquivo do módulo e contagem do Resumo atualizada.
- Ao resolver: mova para docs/pendencias-resolvidas.md (data e evidência: arquivo, teste ou doc) e remova do PENDENCIAS.md. Nunca deixe `[x]` no principal. Sem evidência, mantenha aberto como [VERIFICAR].
- Débito técnico só é P1 se o risco for de dados ou concorrência. VALIDAR é só para o que exige rodar algo em ambiente real (roteiro em docs/validacoes-banco-real.md); defeito confirmado é BUG, DÉBITO ou FEATURE.
- Falha numa validação vira BUG com ID novo; o item original só fecha quando a validação passa.
- Fato que não é pendência (decisão tomada, regra de negócio) vai para docs/modulos/ ou docs/adr/.
- Orçamento: PENDENCIAS.md até ~25 KB; passou, mova detalhe para docs/pendencias/.
- Para ler: `/pendencias` (Resumo + P0/P1) ou `/pendencias <módulo|P0>`; não leia o arquivo todo à toa.
