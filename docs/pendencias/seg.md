# Pendências: Segurança (SEG)

Texto completo dos itens abertos. Resumo e P0/P1 em PENDENCIAS.md.

<a id="seg-001"></a>
### SEG-001: Configurar CSP (Content-Security-Policy) em next.config.mjs antes de publicar.

**P1 · FEATURE** · origem: 2026-11-24

A CSP ainda não está configurada em `next.config.mjs`; hoje só existem os cabeçalhos básicos. docs/padroes.md exige cabeçalhos de segurança (CSP etc.). Definir a política compatível com Next.js 16 e Supabase (scripts, estilos, conexões ao domínio do Supabase), testar no build e antes do primeiro deploy.
