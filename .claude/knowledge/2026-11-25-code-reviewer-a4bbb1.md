---
agent: code-reviewer
data: 2026-11-25
origem: agent
---

## bug
- **Lost update em `ativo`:** RPC lia o valor e reenviava em `p_ativo`, causando sobrescrita acidental. Resolvido removendo o parâmetro e deixando a coluna inalterada no UPDATE da tabela `produtos`.
- **Race condition em `editarProduto` sem `lojaIds`:** função lia os vínculos atuais e reenviava, criando janela de mudança. Resolvido rejeitando lista nula no serviço e validando apenas dentro da RPC com `if p_loja_ids is not null`.

## decisao
- **Validação de lojas em RPCs:** rejeitar lojas inexistentes/inativas com erro 22023 e hint `lojas_invalidas`, centralizando a lógica no banco em vez de deixar apenas no cliente.
- **Triggers de loja com WHEN:** separar INSERT (`new.ativo`) de UPDATE (`after update of ativo` com `new.ativo and old.ativo is distinct from true`), evitando disparo desnecessário em mudanças que não afetam disponibilidade.
- **Função SQL com mudança de assinatura:** fazer `drop function if exists` antes de `create`, porque `create or replace` falha se muda tipo de retorno; garantir idempotência com `if exists`.

## padrao
- **Mapeamento de erro 22023:** no repositório, hint `lojas_invalidas` vira mensagem de negócio ("lojas indisponíveis"); sem hint vira mensagem de lista vazia. Ambas em português, sem texto cru do banco.
- **Validação de lojas:** rotina única chamada nas três RPCs (criar, salvar, definir) que rejeita nulo, inexistente ou inativo.
