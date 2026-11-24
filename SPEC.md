# SPEC.md

## Problema

Hoje o estoque e as requisições das lojas são controlados em planilhas. O sistema deve permitir:

- saber o saldo real de cada produto em cada loja;
- controlar as saídas (consumo e transferência entre lojas);
- detectar divergências comparando contagens;
- centralizar todas as lojas em um só lugar.

## Usuários

- O dono do sistema e a equipe central (poucas pessoas).
- Um único perfil de acesso: todos os usuários podem tudo.
- Acesso por e-mail e senha; o sistema não fica aberto ao público.
- Volume estimado: ~6 lojas e ~500 produtos no total, com expectativa de crescimento.
- Uso em computador e celular (layout responsivo).

## Funcionalidades

### Essenciais

- **Login:** acesso por usuário e senha.
- **Lojas:** cadastro de lojas; consulta de estoque geral ou por loja.
- **Produtos:** cadastro manual com nome, código/SKU, categoria, estoque mínimo e fator caixa→unidade. O produto pode ser controlado por caixa e unidade (ex.: 3 caixas + 10 unidades de long neck).
- **Importação por planilha:**
  - cadastrar produtos novos e atualizar existentes (pelo código);
  - subir o estoque inicial por loja (caixas + unidades), registrado no histórico como contagem inicial, que serve de base para a primeira comparação.
- **Contagem de estoque:**
  - lançada por loja e data;
  - fluxo em rascunho e confirmação;
  - ao confirmar, o estoque atual da loja passa a ser o valor contado;
  - sempre comparada com a contagem anterior;
  - produtos não informados: o sistema pergunta na hora se mantém o saldo ou zera.
- **Requisições de saída:**
  - lançadas por loja, para consumo ou transferência entre lojas;
  - a transferência é automática: sai de uma loja e entra na outra no mesmo lançamento;
  - estoque negativo: avisa e permite confirmar;
  - requisição com data anterior à última contagem: o saldo é recalculado a partir da contagem.
- **Estoque atual:** visão geral e por loja, exibida em caixas + unidades.
- **Histórico:** de contagens (com comparação contra a anterior) e de requisições.
- **Exportação:** Excel/CSV.

### Fora do escopo

- Compras e fornecedores.
- Custos e valores em reais (valorização do estoque).
- Leitor de código de barras.
- App offline / PWA.
- Perfis de permissão diferentes (admin, operador, leitura).
- Alerta de estoque mínimo como tela própria (o campo existe no produto, mas a tela não é essencial no MVP).
- Exportação em PDF.

## Módulos

| Módulo       | Responsabilidade                                                                                         | Doc futuro                   |
| ------------ | -------------------------------------------------------------------------------------------------------- | ---------------------------- |
| autenticacao | Login por e-mail/senha (Supabase Auth) e proteção de rotas                                               | docs/modulos/autenticacao.md |
| lojas        | CRUD de lojas                                                                                            | docs/modulos/lojas.md        |
| produtos     | Cadastro de produtos, categoria, SKU, estoque mínimo e fator caixa→unidade; conversão caixa/unidade      | docs/modulos/produtos.md     |
| importacao   | Upload de planilha para cadastrar e atualizar produtos e subir o estoque inicial por loja, com validação | docs/modulos/importacao.md   |
| contagem     | Contagem por loja e data, rascunho, confirmação e comparação com a anterior                              | docs/modulos/contagem.md     |
| requisicoes  | Saídas por consumo e transferência entre lojas; recálculo de saldo                                       | docs/modulos/requisicoes.md  |
| estoque      | Consulta do estoque atual, geral e por loja                                                              | docs/modulos/estoque.md      |
| historico    | Listagem e filtros de contagens e requisições; exportação Excel/CSV                                      | docs/modulos/historico.md    |

## Stack

| Camada               | Tecnologia                        |
| -------------------- | --------------------------------- |
| Framework            | Next.js (App Router) + TypeScript |
| Banco e autenticação | Supabase (Postgres + Auth)        |
| Hospedagem           | Vercel                            |
| Estilo               | Tailwind CSS                      |
| Planilhas            | SheetJS                           |
| Testes               | Vitest                            |

## Constraints técnicas

- O sistema roda na web, hospedado na Vercel, e usa o Supabase para armazenar os dados.
- Acesso restrito por login; nenhuma rota de dados fica aberta ao público.
- Quantidades guardadas na menor unidade; a conversão para caixas + unidades é feita só na exibição.
- Segurança: RLS ativado no Supabase e chave de serviço nunca exposta ao navegador.
- Layout responsivo, usável em computador e celular.
- O projeto fica na pasta atual (`Carla_Estoque`), que não está sincronizada.
- Deve haver um passo a passo para criar e conectar o Supabase.

## Critérios de aceitação

- [ ] Só usuários autenticados acessam o sistema.
- [ ] É possível cadastrar lojas e produtos manualmente.
- [ ] A importação por planilha cria produtos novos e atualiza os existentes pelo código; linhas inválidas são rejeitadas e não duplicam produtos.
- [ ] A importação de estoque inicial define o saldo de cada produto na loja informada, é registrada como contagem inicial no histórico, aceita caixas + unidades e rejeita loja ou produto inexistente.
- [ ] Conversão caixa/unidade: 3 caixas + 10 unidades com fator 24 resulta em 82 unidades, e o caminho inverso também funciona.
- [ ] Ao confirmar uma contagem, o estoque atual da loja passa a ser o valor contado, e as contagens antigas ficam intactas.
- [ ] Toda contagem exibe a diferença contra a contagem anterior da mesma loja.
- [ ] Uma requisição de consumo baixa o saldo da loja correta e não afeta outras lojas.
- [ ] Uma requisição de transferência baixa a loja de origem e soma na de destino no mesmo lançamento.
- [ ] Uma requisição que deixaria o saldo negativo mostra aviso e permite confirmar.
- [ ] Uma requisição com data anterior à última contagem recalcula o saldo a partir da contagem.
- [ ] A tela de estoque mostra visão geral e por loja, em caixas + unidades.
- [ ] Os históricos de contagens e requisições são consultáveis, e é possível exportá-los em Excel/CSV.

## Decisões em aberto

- Ao confirmar uma contagem, como tratar itens omitidos: o sistema pergunta na hora, mas falta definir se a escolha vale para todos os itens ou item a item.
- A transferência entre lojas é automática; falta definir se ela pode ser desfeita ou editada depois de lançada.
- Falta definir se o cadastro de produtos e lojas pode ser excluído ou só desativado, quando já houver histórico.
- Falta definir o formato (colunas) das planilhas de importação (produtos e estoque inicial).
- Falta definir se o estoque inicial pode ser reimportado quando a loja já tem movimentação.
- Falta definir como criar os usuários (convite pelo painel do Supabase ou tela própria).
- Falta decidir o nome do app (será sugerido na geração do CLAUDE.md).
