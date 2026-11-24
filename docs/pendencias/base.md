# Pendências: Base e convenções (BASE)

Texto completo dos itens abertos. Resumo e P0/P1 em PENDENCIAS.md.

<a id="base-001"></a>
### BASE-001: Ativar o pre-commit: exige git init e npx simple-git-hooks.

**P2 · DÉBITO** · origem: 2026-11-24

O pre-commit (simple-git-hooks + lint-staged) está configurado no package.json, mas só ativa depois de `git init` e `npx simple-git-hooks`. A pasta ainda não é um repositório Git.

<a id="base-003"></a>
### BASE-003: Definir nomenclatura de código e cobertura mínima de testes (CLAUDE.md diz a definir).

**P2 · DECISÃO** · origem: 2026-11-24

No CLAUDE.md, a nomenclatura de arquivos, funções, endpoints e componentes ainda está "a definir", assim como a cobertura mínima de testes. Decidir com o usuário e registrar em CLAUDE.md/docs/padroes.md.

<a id="base-004"></a>
### BASE-004: Rodar o subir-github.bat de verdade (primeiro push) e conferir backup e proteções.

**P2 · VALIDAR** · origem: 2026-11-24

O subir-github.bat (raiz) só teve testada a parte de backup (--so-backup). Falta o primeiro uso real: git init, remoto https://github.com/israelAPPC/estoque_facil.git, login pelo Git Credential Manager, testes, conferência de segredos, commit e push. Se o GitHub já tiver commits (README criado no site), o push é recusado: rode `git pull --rebase origin main` e o .bat de novo (ele nunca usa --force). O .bat também ativa o pre-commit (npx simple-git-hooks), o que encaminha BASE-001.

<a id="base-002"></a>
### BASE-002: Criar a rota /ready recomendada em docs/padroes.md.

**P3 · IDEIA** · origem: 2026-11-24

A rota `/ready` (recomendada em docs/padroes.md, ao lado de /health) não foi criada.
