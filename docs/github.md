# GitHub e backup

Repositório: https://github.com/israelAPPC/estoque_facil.git (branch `main`). Quem faz commit e push é você: os agents são bloqueados por hook.

## `subir-github.bat` (raiz; duplo clique ou no terminal)
| Comando | O que faz |
|---|---|
| `subir-github.bat` | backup local, lint/tipos/testes, conferência de segredos, commit (você confirma com S) e push |
| `subir-github.bat "feat: texto"` | idem, com a sua mensagem (padrão: `chore: atualizacao AAAA-MM-DD`) |
| `--so-backup` | só o zip de backup, sem Git |
| `--sem-testes` / `--sem-backup` | pula essa etapa |

Etapas: (1) zip em `%USERPROFILE%\Backups\estoque_facil\estoque_facil_AAAAMMDD_HHMM.zip` (sem node_modules, .next, .git, .cache; guarda os 10 últimos; **inclui .env.local e rag.db**, por isso fica fora do projeto e do Git); (2) `git init` e `origin` na primeira vez (e ativa o pre-commit com `npx simple-git-hooks`); (3) `npm run lint`, `typecheck` e `test`; (4) `git add -A`, aborta se houver `.env*` (menos `.env.example`), `.pem`, `.key`, `rag.db`, `.sqlite` ou padrões de chave no conteúdo, e mostra o `git status`; (5) commit e `git push -u origin main`.

Limites de segurança: nunca usa `--force`; não guarda senha nem token (o login fica com o Git Credential Manager do Windows, que abre o navegador na primeira vez); se `origin` apontar para outro repositório, para. Pré-requisito: configurar `git config --global user.name` e `user.email` uma vez.

Primeiro push em repositório que já tem commits no GitHub (por exemplo um README criado no site): o push é recusado; rode `git pull --rebase origin main` e o .bat de novo.

Restaurar um backup: descompacte o zip numa pasta nova e rode `npm install`. Item de validação: BASE-004.
