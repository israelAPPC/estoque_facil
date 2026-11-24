# Padrões de engenharia

Vale para todo o projeto. Itens marcados como "recomendado" são opcionais.

## Stack e dependências

- Next.js + Supabase + Vercel: a opção mais simples que cumpre o SPEC (um só deploy, banco e login prontos).
- TypeScript em modo strict, sem `any` em código novo.
- Lockfile versionado, `engines` no package.json e `.nvmrc`.
- Poucas dependências, bem mantidas; evitar versões publicadas há menos de 14 dias.
- Validar variáveis de ambiente na inicialização (zod); manter `.env.example` completo.

## Segurança (checklist)

- Segredos só em `.env`; uma chave por finalidade; nunca em código, log ou arquivo de contexto.
- A chave de serviço do Supabase fica só no servidor; o navegador usa apenas a chave pública (anon).
- RLS ativado em todas as tabelas; nenhuma tabela sem política.
- Toda entrada de rota e de formulário validada (zod); SQL sempre parametrizado.
- Nunca devolver mensagem crua de banco ou exceção ao cliente.
- Operações que mexem em saldo (contagem, requisição, transferência, importação) rodam em transação.
- Autenticação por Supabase Auth (cookie httpOnly, SameSite, Secure); limite de tentativas no login (recomendado).
- Todas as rotas e páginas exigem login; nenhuma rota de dados é pública.
- Cabeçalhos de segurança (CSP etc.) configurados no Next.js.
- Upload de planilha: limitar tamanho e tipo (xlsx/csv) e validar linha a linha antes de gravar.
- Dependências: `npm audit` periódico; Dependabot/Renovate se houver repositório remoto (recomendado).
- Dados pessoais: coletar só o necessário (e-mail dos usuários); observar a LGPD (conferir com profissional).
- Agents: `.env` e segredos em `permissions.deny`; hooks bloqueiam `git push`, `rm -rf` e comandos destrutivos fora do escopo.

## Arquitetura

- Camadas: rota/página → serviço (regra de negócio) → repositório (acesso ao Supabase).
- Regras de negócio em funções puras e testáveis (conversão caixa/unidade, diferença entre contagens, recálculo de saldo).
- Monolito modular: cada módulo = 1 doc em `docs/modulos/` = 1 agent responsável.
- Quantidades sempre na menor unidade; converter para caixas + unidades só na exibição.
- Contagens e requisições são registros imutáveis; correção é um novo lançamento, nunca edição silenciosa.
- Migrações de banco idempotentes e versionadas em `supabase/`.
- Paginação nas listagens e no histórico; timeout em consultas pesadas.
- Observabilidade mínima: log estruturado e rota `/health` (recomendado: `/ready`).
- Decisões relevantes registradas em ADR curto: `docs/adr/NNNN-titulo.md`
  (contexto, decisão, alternativas, consequências).

## Clean code

- Nomes que dizem a intenção; funções pequenas; sem números mágicos; erros tipados.
- Sem abstração prematura (extrair só na 3ª repetição).
- Lint, formatação e checagem de tipos (ESLint + Prettier ou Biome) no pre-commit
  e no hook de PostToolUse.
- Todo bug vira teste de regressão ANTES da correção; cobertura é guia, não meta.

## Interface (decisão do usuário, 2026-11-24)

- Layout clean e moderno, paleta natural **off-white + verde sálvia** (sem cinzas):
  fundo `#FAF8F3` (creme), texto `#2F3A2F` (verde quase preto), bordas `#E4E0D5` (areia),
  ação principal `#5B7F5E` (sálvia), erro `#B54A3C`, aviso `#B7862B`.
- Navegação por **menu lateral** fixo à esquerda (desktop). No celular, **barra de menu fixa embaixo** (bottom nav): Estoque, Contagens, Requisições, Histórico e "Mais" (Lojas, Produtos, Sair); ícone + texto curto, área de toque ≥ 44px.
- Menu agrupado em dois módulos (decisão do usuário, 2026-11-24; só navegação, o código segue por módulo): **Estoque** (Estoque atual, Contagens, Requisições, Histórico) e **Cadastro** (Produtos, Lojas). No celular, o "Mais" mostra o grupo Cadastro e Sair.
- Só a cor sálvia como destaque; o resto em creme/areia/verde-escuro.
- Sem firulas: nada de gradientes, sombras fortes, animações decorativas, ícones em excesso ou muitas cores.
- Cor só com significado (erro, aviso, sucesso), sempre acompanhada de texto.
- Muito espaço em branco, tipografia legível, mobile primeiro (320px).

## Git e entrega

- Conventional Commits; PRs pequenos; CHANGELOG atualizado.
- Definition of Done:
  - [ ] testes passando (incluindo regressão do bug, se for correção)
  - [ ] lint e tipos sem erro
  - [ ] doc do módulo em `docs/modulos/` atualizada
  - [ ] CHANGELOG e, se houver, ADR registrados
  - [ ] pendências registradas em `PENDENCIAS.md`
  - [ ] revisão do @code-reviewer sem bloqueantes
- README permite rodar o projeto em 5 minutos.

## Ambiente de desenvolvimento

- O projeto fica em `Carla_Estoque`, dentro de `OneDrive\Desktop`, mas a pasta não está sincronizada (confirmado pelo usuário). Se a sincronização for ligada, excluir `node_modules`, `.next` e `.git`.
- Usar um remoto Git como backup (recomendado).
