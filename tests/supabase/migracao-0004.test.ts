import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const CAMINHO = fileURLToPath(
  new URL(
    "../../supabase/migrations/0004_produto_lojas_corridas.sql",
    import.meta.url,
  ),
);

function lerSql(): string {
  if (!existsSync(CAMINHO)) return "";
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
const ASSINATURA_SALVAR_ANTIGA =
  "public.salvar_produto_com_lojas(uuid, text, text, text, integer, integer, boolean, uuid[])";
const ASSINATURA_SALVAR =
  "public.salvar_produto_com_lojas(uuid, text, text, text, integer, integer, uuid[])";
const ASSINATURA_DEFINIR = "public.definir_lojas_produto(uuid, uuid[])";
const VALIDA_LOJAS_ATIVAS =
  /not exists \(\s*select 1 from public\.lojas lj where lj\.id = l and lj\.ativo\s*\)[\s\S]*?errcode = '22023', hint = 'lojas_invalidas'/;

describe("migração 0004_produto_lojas_corridas.sql", () => {
  const sql = lerSql();

  it("existe e roda em transação única", () => {
    expect(sql.trim().startsWith("begin;")).toBe(true);
    expect(sql.trim().endsWith("commit;")).toBe(true);
  });

  it("não cria tabela nem usa create function sem or replace", () => {
    expect(sql).not.toMatch(/create table/);
    expect(sql).not.toMatch(/create function/);
  });

  it("toda função é security invoker e fixa search_path", () => {
    const n = [...sql.matchAll(/create or replace function/g)].length;
    expect(n).toBe(4);
    expect([...sql.matchAll(/security invoker/g)].length).toBe(n);
    expect([...sql.matchAll(/set search_path = ''/g)].length).toBe(n);
    expect(sql).not.toMatch(/security definer/);
  });

  it("remove a assinatura antiga de salvar (com p_ativo)", () => {
    expect(sql).toContain(
      `drop function if exists ${ASSINATURA_SALVAR_ANTIGA};`,
    );
  });

  it("salvar não recebe nem altera ativo e devolve a linha do produto", () => {
    expect(sql).toMatch(
      /create or replace function public\.salvar_produto_com_lojas\(\s*p_produto_id uuid,\s*p_sku text,\s*p_nome text,\s*p_categoria text,\s*p_fator_caixa integer,\s*p_estoque_minimo_unidades integer,\s*p_loja_ids uuid\[\]\s*\)\s*returns public\.produtos/,
    );
    const corpo = corpoDe(sql, "salvar_produto_com_lojas");
    expect(corpo).not.toMatch(/p_ativo/);
    expect(corpo).not.toMatch(/ativo = /);
    expect(corpo).toMatch(/for update/);
    expect(corpo).toMatch(/errcode = 'p0002'/);
    expect(corpo).toMatch(/returning \* into v_produto/);
    expect(corpo).toMatch(/return v_produto;/);
  });

  it("salvar: lista nula mantém vínculos e lista vazia é erro 22023", () => {
    const corpo = corpoDe(sql, "salvar_produto_com_lojas");
    expect(corpo).toMatch(
      /p_loja_ids is not null and cardinality\(p_loja_ids\) = 0/,
    );
    expect(corpo).toMatch(
      /if p_loja_ids is not null then[\s\S]*delete from public\.produto_lojas/,
    );
    expect(corpo).toMatch(VALIDA_LOJAS_ATIVAS);
  });

  it("criar e definir exigem lista não vazia e só lojas ativas", () => {
    for (const nome of ["criar_produto_com_lojas", "definir_lojas_produto"]) {
      const corpo = corpoDe(sql, nome);
      expect(corpo).toMatch(/coalesce\(cardinality\(p_loja_ids\), 0\) = 0/);
      expect(corpo).toMatch(VALIDA_LOJAS_ATIVAS);
    }
  });

  it("execute das RPCs só para authenticated", () => {
    for (const a of [ASSINATURA_CRIAR, ASSINATURA_SALVAR, ASSINATURA_DEFINIR]) {
      expect(sql).toContain(
        `revoke execute on function ${a} from public, anon;`,
      );
      expect(sql).toContain(`grant execute on function ${a} to authenticated;`);
    }
  });

  it("triggers separados de insert e de update of ativo com when", () => {
    expect(sql).toContain(
      "drop trigger if exists lojas_vincular_produtos on public.lojas;",
    );
    expect(sql).toMatch(
      /create trigger lojas_vincular_produtos_insert\s+after insert on public\.lojas\s+for each row when \(new\.ativo\)\s+execute function public\.vincular_produtos_loja_nova\(\)/,
    );
    expect(sql).toMatch(
      /create trigger lojas_vincular_produtos_reativar\s+after update of ativo on public\.lojas\s+for each row when \(new\.ativo and old\.ativo is distinct from true\)\s+execute function public\.vincular_produtos_loja_nova\(\)/,
    );
    expect(sql).toContain(
      "drop trigger if exists lojas_vincular_produtos_insert on public.lojas;",
    );
    expect(sql).toContain(
      "drop trigger if exists lojas_vincular_produtos_reativar on public.lojas;",
    );
    expect(sql).toContain(
      "revoke execute on function public.vincular_produtos_loja_nova() from public, anon, authenticated;",
    );
  });
});
