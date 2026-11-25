import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const CAMINHO = fileURLToPath(
  new URL(
    "../../supabase/migrations/0003_produto_lojas_ajustes.sql",
    import.meta.url,
  ),
);

function lerSql(): string {
  if (!existsSync(CAMINHO)) return "";
  // remove comentários de linha para não casar texto explicativo
  return readFileSync(CAMINHO, "utf8")
    .split("\n")
    .map((linha) => linha.replace(/--.*$/, ""))
    .join("\n")
    .toLowerCase();
}

function corpoDe(sql: string, nome: string): string {
  const m = sql.match(
    new RegExp(
      `function public\\.${nome}\\([\\s\\S]*?as \\$\\$([\\s\\S]*?)\\$\\$;`,
    ),
  );
  return m?.[1] ?? "";
}

const ASSINATURA_CRIAR =
  "public.criar_produto_com_lojas(text, text, text, integer, integer, boolean, uuid[])";
const ASSINATURA_SALVAR =
  "public.salvar_produto_com_lojas(uuid, text, text, text, integer, integer, boolean, uuid[])";
const SO_LOJAS_ATIVAS =
  /and loja_id in \(select id from public\.lojas where ativo\)/;

describe("migração 0003_produto_lojas_ajustes.sql", () => {
  const sql = lerSql();

  it("existe e roda em transação única", () => {
    expect(sql.trim().startsWith("begin;")).toBe(true);
    expect(sql.trim().endsWith("commit;")).toBe(true);
  });

  it("não cria tabela nem usa create function sem or replace", () => {
    expect(sql).not.toMatch(/create table/);
    expect(sql).not.toMatch(/create function/);
  });

  it("toda função é security invoker, fixa search_path e tem corpo $$", () => {
    const funcoes = [...sql.matchAll(/create or replace function/g)];
    expect(funcoes.length).toBe(4);
    expect([...sql.matchAll(/security invoker/g)].length).toBe(4);
    expect([...sql.matchAll(/set search_path = ''/g)].length).toBe(4);
    expect([...sql.matchAll(/as \$\$[\s\S]*?\$\$;/g)].length).toBe(4);
    expect(sql).not.toMatch(/security definer/);
  });

  it("criar_produto_com_lojas insere produto e vínculos e devolve o id", () => {
    expect(sql).toMatch(
      /create or replace function public\.criar_produto_com_lojas\(\s*p_sku text,\s*p_nome text,\s*p_categoria text,\s*p_fator_caixa integer,\s*p_estoque_minimo_unidades integer,\s*p_ativo boolean,\s*p_loja_ids uuid\[\]\s*\)\s*returns uuid/,
    );
    const corpo = corpoDe(sql, "criar_produto_com_lojas");
    expect(corpo).toMatch(/cardinality\(p_loja_ids\), 0\) = 0/);
    expect(corpo).toMatch(/errcode = '22023'/);
    expect(corpo).toMatch(/insert into public\.produtos/);
    expect(corpo).toMatch(/returning id into/);
    expect(corpo).toMatch(/insert into public\.produto_lojas/);
    expect(corpo).toMatch(/return v_id;/);
  });

  it("salvar_produto_com_lojas trava, atualiza e substitui só vínculos de lojas ativas", () => {
    expect(sql).toMatch(
      /create or replace function public\.salvar_produto_com_lojas\(\s*p_produto_id uuid,\s*p_sku text,\s*p_nome text,\s*p_categoria text,\s*p_fator_caixa integer,\s*p_estoque_minimo_unidades integer,\s*p_ativo boolean,\s*p_loja_ids uuid\[\]\s*\)\s*returns void/,
    );
    const corpo = corpoDe(sql, "salvar_produto_com_lojas");
    expect(corpo).toMatch(/cardinality\(p_loja_ids\), 0\) = 0/);
    expect(corpo).toMatch(/for update/);
    expect(corpo).toMatch(/errcode = 'p0002'/);
    expect(corpo).toMatch(/update public\.produtos/);
    expect(corpo).toMatch(/delete from public\.produto_lojas/);
    expect(corpo).toMatch(SO_LOJAS_ATIVAS);
    expect(corpo).toMatch(/on conflict \(produto_id, loja_id\) do nothing/);
  });

  it("definir_lojas_produto passa a preservar vínculos de lojas desativadas", () => {
    expect(sql).toContain(
      "create or replace function public.definir_lojas_produto(p_produto_id uuid, p_loja_ids uuid[])",
    );
    const corpo = corpoDe(sql, "definir_lojas_produto");
    expect(corpo).toMatch(/for update/);
    expect(corpo).toMatch(SO_LOJAS_ATIVAS);
  });

  it("execute das RPCs só para authenticated", () => {
    for (const assinatura of [
      ASSINATURA_CRIAR,
      ASSINATURA_SALVAR,
      "public.definir_lojas_produto(uuid, uuid[])",
    ]) {
      expect(sql).toContain(
        `revoke execute on function ${assinatura} from public, anon;`,
      );
      expect(sql).toContain(
        `grant execute on function ${assinatura} to authenticated;`,
      );
    }
  });

  it("trigger roda no insert e quando a loja passa de inativa para ativa", () => {
    expect(sql).toContain(
      "drop trigger if exists lojas_vincular_produtos on public.lojas;",
    );
    expect(sql).toMatch(
      /create trigger lojas_vincular_produtos\s+after insert or update of ativo on public\.lojas\s+for each row execute function public\.vincular_produtos_loja_nova\(\)/,
    );
    const corpo = corpoDe(sql, "vincular_produtos_loja_nova");
    expect(corpo).toMatch(/tg_op = 'insert'/);
    expect(corpo).toMatch(/not coalesce\(old\.ativo, false\)/);
    expect(corpo).toMatch(/where p\.ativo/);
    expect(corpo).toMatch(/on conflict \(produto_id, loja_id\) do nothing/);
    expect(sql).toContain(
      "revoke execute on function public.vincular_produtos_loja_nova() from public, anon, authenticated;",
    );
  });
});
