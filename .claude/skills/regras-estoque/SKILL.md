---
name: regras-estoque
description: Regras de negócio de estoque (contagem, requisição, transferência, saldo, caixa/unidade). Use ao mexer em src/modules/contagem, requisicoes, estoque ou produtos/unidades.
---

# Regras de estoque

Fonte: SPEC.md. Leia também o doc do módulo em `docs/modulos/` antes de alterar.

## Quando usar
- Implementar ou alterar contagem, requisição de consumo, transferência, consulta de estoque ou conversão caixa/unidade.
- Escrever testes dessas regras.

## Regras
1. **Menor unidade:** tudo é gravado em unidades. `paraUnidades(caixas, unidades, fator)` na entrada e `paraCaixas(total, fator)` só na exibição. Nunca gravar caixas e unidades separados.
2. **Contagem:** nasce como rascunho e não mexe no estoque. Ao confirmar (em transação), o `estoque_atual` da loja passa a ser o valor contado. Itens omitidos: o usuário escolhe `manter` ou `zerar` na hora. Contagens antigas nunca são alteradas. Sempre comparar com a contagem anterior da mesma loja (`compararContagens`). Sem anterior, a diferença vem marcada como "inicial".
3. **Estoque inicial (importação):** entra como contagem inicial no histórico e serve de base para a primeira comparação.
4. **Saldo:** `calcularSaldo(base, movimentos)` = contagem-base + movimentos com data posterior à base. Movimento com data anterior à contagem-base não entra no saldo (a contagem já reflete a realidade), mas fica no histórico. Requisição retroativa recalcula o saldo a partir da contagem.
5. **Consumo:** baixa só a loja informada.
6. **Transferência:** baixa a origem e soma no destino na mesma transação. Origem igual ao destino é rejeitada.
7. **Saldo negativo:** devolve aviso e só grava com confirmação explícita. Nunca bloquear.
8. **Quantidade** zero ou negativa na requisição é rejeitada. Fator de caixa inválido (zero, negativo, não inteiro) lança erro tipado.
9. Contagens e requisições são imutáveis; correção é um novo lançamento.

## Exemplos
- Entrada: 3 caixas + 10 un, fator 24 → grava `82`. Exibição de `82` → "3 cx + 10 un".
- Contagem 100, consumo de 18 (saldo 82), nova contagem de 80 → saldo 80; comparação mostra delta `-20` contra a contagem anterior (100).
- Consumo de 5 com saldo 3 → aviso "saldo ficará em -2"; grava só se o usuário confirmar.

## Quando NÃO usar
- Tarefas de login, cadastro de lojas ou produtos sem relação com saldo, layout de tela ou migração SQL (use as skills específicas).
- Decisões ainda em aberto (ver `docs/decisoes-em-aberto.md`): não invente a regra, pergunte ao usuário.
