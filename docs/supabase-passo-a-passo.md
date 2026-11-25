# Supabase: passo a passo (para quem nunca usou)

Guia para criar o banco do EstoqueFácil e ligá-lo ao sistema. Leva uns 15 minutos. Você vai precisar de um e-mail e de um navegador.

> Regra de ouro: a chave **service_role** é como a senha mestra do banco. Nunca cole em chat, e-mail, print, planilha ou em arquivo que vá para o GitHub. Ela só vai no `.env.local` (que fica só no seu computador) e na Vercel.

## 1. Criar a conta e o projeto

1. Acesse https://supabase.com e clique em **Start your project**. Entre com GitHub ou e-mail.
2. Clique em **New project**.
3. Preencha:
   - **Name:** `estoque-facil` (ou outro nome).
   - **Database Password:** clique em **Generate a password** e guarde num gerenciador de senhas.
   - **Region:** escolha **South America (São Paulo)**.
4. Clique em **Create new project** e aguarde 1 a 2 minutos até o painel ficar pronto.

Dica: crie **dois** projetos, um de produção (`estoque-facil`) e um de teste (`estoque-facil-teste`). Os testes automáticos só rodam no de teste.

## 2. Copiar a URL e as chaves

1. No menu à esquerda, abra **Project Settings** (engrenagem) > **API** (ou **Data API** / **API Keys**, conforme a versão do painel).
2. Anote três valores:
   - **Project URL**: algo como `https://abcdefgh.supabase.co`.
   - **anon / public key** (chave pública): pode ir ao navegador; sozinha não dá acesso a nada, porque o banco exige login.
   - **service_role key** (chave secreta): clique em **Reveal** só na hora de colar no `.env.local`.

## 3. Preencher o `.env.local`

1. Na pasta do projeto, copie o arquivo `.env.example` e renomeie a cópia para `.env.local`.
2. Abra o `.env.local` num editor de texto e preencha:

```
NEXT_PUBLIC_SUPABASE_URL=https://SEU-PROJETO.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=COLE_AQUI_A_CHAVE_ANON
SUPABASE_SERVICE_ROLE_KEY=COLE_AQUI_A_CHAVE_SERVICE_ROLE
```

Cuidados:
- A service role **nunca** leva o prefixo `NEXT_PUBLIC_` (esse prefixo manda a variável para o navegador).
- O `.env.local` já é ignorado pelo Git. Não o envie a ninguém.
- Se a service role vazar, gere outra em **Project Settings > API** e atualize o `.env.local` e a Vercel.

## 4. Rodar a migração (criar as tabelas)

1. No painel do Supabase, abra **SQL Editor** > **New query**.
2. No seu computador, abra `supabase/migrations/0001_schema.sql`, selecione tudo e copie.
3. Cole no SQL Editor e clique em **Run**. Deve aparecer "Success. No rows returned".
4. Confira em **Table Editor**: devem existir `lojas`, `produtos`, `contagens`, `contagem_itens`, `requisicoes`, `requisicao_itens` e `estoque_atual`, todas com o selo **RLS enabled**.
5. Pode rodar o mesmo arquivo de novo sem problema: ele não duplica nada nem dá erro.

### 4.1 Aplicar a 0002 (produto por loja)

1. Depois da 0001, abra **SQL Editor** > **New query**.
2. Copie todo o conteúdo de `supabase/migrations/0002_produto_lojas.sql`, cole e clique em **Run**. Deve aparecer "Success. No rows returned".
3. Confira em **Table Editor** que existe `produto_lojas` com o selo **RLS enabled**. Se já havia produtos e lojas, cada produto aparece ligado a todas as lojas ativas.
4. Rodar de novo não duplica nada: o arquivo inteiro roda numa transação só e, se algo falhar, nada é gravado.

### 4.2 Aplicar a 0003 (ajustes de produto por loja)

1. Depois da 0002, abra **SQL Editor** > **New query**.
2. Copie todo o conteúdo de `supabase/migrations/0003_produto_lojas_ajustes.sql`, cole e clique em **Run**. Deve aparecer "Success. No rows returned".
3. Em **Database** > **Functions**, confira que aparecem `criar_produto_com_lojas` e `salvar_produto_com_lojas`.
4. Pode rodar de novo sem problema: o arquivo só recria funções e o gatilho, sem mexer nos dados.

### 4.3 Aplicar a 0004 (corridas em produto por loja)

Atenção: aplique a 0004 só quando a versão do app que já usa a nova `salvar_produto_com_lojas` (sem o campo "ativo") estiver publicada; senão a edição de produto passa a dar erro.

1. Depois da 0003, abra **SQL Editor** > **New query**.
2. Copie todo o conteúdo de `supabase/migrations/0004_produto_lojas_corridas.sql`, cole e clique em **Run**. Deve aparecer "Success. No rows returned".
3. Em **Database** > **Functions**, confira que só existe UMA `salvar_produto_com_lojas` (a antiga foi apagada).
4. Em **Database** > **Triggers**, confira que em `lojas` aparecem `lojas_vincular_produtos_insert` e `lojas_vincular_produtos_reativar` (e não mais `lojas_vincular_produtos`).
5. Pode rodar de novo sem problema: só recria funções e gatilhos, sem mexer nos dados.

Migrações futuras (`0005_...`) seguem o mesmo caminho, sempre em ordem de número. Nunca edite uma migração que já rodou.

## 5. Criar o primeiro usuário

O sistema não tem cadastro público. Em **Authentication** > **Users** > **Add user** > **Create new user**, informe e-mail e senha e marque **Auto Confirm User**. (Como os usuários serão criados no dia a dia ainda é uma decisão em aberto.)

Recomendado: em **Authentication** > **Sign In / Providers**, desligue **Allow new users to sign up**, para ninguém se cadastrar sozinho.

## 6. Rodar os testes de banco (opcional, só no projeto de teste)

1. No projeto **de teste**, rode a migração (passo 4) e crie um usuário de teste (passo 5).
2. No terminal (Git Bash), defina as variáveis só para a sessão, sem gravar em arquivo:

```
export TEST_SUPABASE_URL=https://SEU-PROJETO-TESTE.supabase.co
export TEST_SUPABASE_ANON_KEY=COLE_AQUI_A_CHAVE_ANON_DE_TESTE
export TEST_SUPABASE_EMAIL=usuario-teste@exemplo.com
export TEST_SUPABASE_PASSWORD=SENHA_DO_USUARIO_DE_TESTE
npm run test:db
```

Os testes criam lojas e produtos com nome "Teste ..." no banco de teste; eles ficam lá (não há exclusão). Nunca aponte essas variáveis para o projeto de produção.

## Problemas comuns

- **"permission denied" no app sem login:** é o esperado; tudo exige login.
- **Erro ao rodar a migração:** copie a mensagem e peça ajuda; não altere o arquivo da migração.
- **Esqueci a senha do banco:** **Project Settings** > **Database** > **Reset database password**.
