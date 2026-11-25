import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const CAMINHO = fileURLToPath(
  new URL("../../supabase/migrations/0002_produto_lojas.sql", import.meta.url),
);

function lerSql(): string {
  // remove comentários de linha para não casar texto explicativo
  return readFileSync(CAMINHO, "utf8")
    .split("\n")
    .map((linha) => linha.replace(/--.*$/, ""))
    .join("\n")
    .toLowerCase();
}

describe("migração 0002_produto_lojas.sql", () => {
  const sql = lerSql();

  it("roda em transação única", () => {
    expect(sql.trim().startsWith("begin;")).toBe(true);
    expect(sql.trim().endsWith("commit;")).toBe(true);
  });

  it("cria produto_lojas idempotente com PK composta e FKs restrict", () => {
    expect(sql).toMatch(
      /create table if not exists public\.produto_lojas \([^;]*produto_id uuid not null references public\.produtos \(id\) on delete restrict[^;]*loja_id uuid not null references public\.lojas \(id\) on delete restrict[^;]*criado_em timestamptz not null default now\(\)[^;]*primary key \(produto_id, loja_id\)/,
    );
    expect(sql).not.toMatch(/create table (?!if not exists)/);
    expect(sql).not.toMatch(/create (unique )?index (?!if not exists)/);
    expect(sql).not.toMatch(/on delete cascade/);
  });

  it("tem índice em loja_id", () => {
    expect(sql).toMatch(
      /create index if not exists produto_lojas_loja_idx\s+on public\.produto_lojas \(loja_id\);/,
    );
  });

  it("RLS ativa, anon revogado, só select/insert/delete para authenticated", () => {
    expect(sql).toContain(
      "alter table public.produto_lojas enable row level security;",
    );
    expect(sql).toContain(
      "revoke all on table public.produto_lojas from anon;",
    );
    expect(sql).toContain(
      "grant select, insert, delete on table public.produto_lojas to authenticated;",
    );
    const politicas = [
      ...sql.matchAll(
        /create policy\s+(\w+)\s+on\s+public\.produto_lojas\b[^;]*;/g,
      ),
    ];
    expect(politicas.map((p) => p[0].match(/for (\w+)/)?.[1]).sort()).toEqual([
      "delete",
      "insert",
      "select",
    ]);
    for (const [politica, nome] of politicas) {
      expect(politica).toMatch(/\bto authenticated\b/);
      expect(politica).not.toMatch(/\bto (anon|public)\b/);
      expect(sql).toContain(
        `drop policy if exists ${nome} on public.produto_lojas;`,
      );
    }
  });

  it("backfill: produtos existentes em todas as lojas ativas, sem duplicar", () => {
    expect(sql).toMatch(
      /insert into public\.produto_lojas \(produto_id, loja_id\)\s+select p\.id, l\.id\s+from public\.produtos p\s+cross join public\.lojas l\s+where l\.ativo\s+on conflict \(produto_id, loja_id\) do nothing;/,
    );
  });

  it("trigger after insert em lojas vincula produtos ativos; nenhum trigger em produtos", () => {
    expect(sql).toContain(
      "drop trigger if exists lojas_vincular_produtos on public.lojas;",
    );
    expect(sql).toMatch(
      /create trigger lojas_vincular_produtos\s+after insert on public\.lojas\s+for each row execute function public\.vincular_produtos_loja_nova\(\)/,
    );
    expect(sql).toMatch(/from public\.produtos p\s+where p\.ativo/);
    expect(sql).not.toMatch(/create trigger[^;]*on public\.produtos/);
  });

  it("RPC definir_lojas_produto é security invoker, rejeita vazio e substitui o conjunto", () => {
    expect(sql).toContain(
      "create or replace function public.definir_lojas_produto(p_produto_id uuid, p_loja_ids uuid[])",
    );
    const corpo = sql.match(
      /function public\.definir_lojas_produto[\s\S]*?as \$\$([\s\S]*?)\$\$;/,
    );
    expect(corpo).not.toBeNull();
    expect(sql).toMatch(/definir_lojas_produto[^$]*security invoker/);
    expect(corpo?.[1]).toMatch(/cardinality\(p_loja_ids\), 0\) = 0/);
    expect(corpo?.[1]).toMatch(/delete from public\.produto_lojas/);
    expect(corpo?.[1]).toMatch(
      /on conflict \(produto_id, loja_id\) do nothing/,
    );
    expect(sql).toContain(
      "revoke execute on function public.definir_lojas_produto(uuid, uuid[]) from public, anon;",
    );
    expect(sql).toContain(
      "grant execute on function public.definir_lojas_produto(uuid, uuid[]) to authenticated;",
    );
  });

  it("toda função fixa search_path e tem corpo $$", () => {
    const funcoes = [...sql.matchAll(/create or replace function/g)];
    const corpos = [...sql.matchAll(/as \$\$[\s\S]*?\$\$;/g)];
    const paths = [...sql.matchAll(/set search_path = ''/g)];
    expect(funcoes.length).toBe(2);
    expect(corpos.length).toBe(2);
    expect(paths.length).toBe(2);
  });
});
