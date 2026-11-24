import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const CAMINHO = fileURLToPath(
  new URL("../../supabase/migrations/0001_schema.sql", import.meta.url),
);

const TABELAS = [
  "lojas",
  "produtos",
  "contagens",
  "contagem_itens",
  "requisicoes",
  "requisicao_itens",
  "estoque_atual",
] as const;

function lerSql(): string {
  // remove comentários de linha para não casar texto explicativo
  return readFileSync(CAMINHO, "utf8")
    .split("\n")
    .map((linha) => linha.replace(/--.*$/, ""))
    .join("\n")
    .toLowerCase();
}

function politicasDe(sql: string, tabela: string): string[] {
  const regex = new RegExp(
    `create policy\\s+\\w+\\s+on\\s+public\\.${tabela}\\b[^;]*;`,
    "g",
  );
  return sql.match(regex) ?? [];
}

describe("migração 0001_schema.sql", () => {
  const sql = lerSql();

  it.each(TABELAS)("cria a tabela %s de forma idempotente", (tabela) => {
    expect(sql).toContain(`create table if not exists public.${tabela} (`);
  });

  it("não tem create table/index sem if not exists", () => {
    expect(sql).not.toMatch(/create table (?!if not exists)/);
    expect(sql).not.toMatch(/create (unique )?index (?!if not exists)/);
  });

  it("toda função tem corpo delimitado por $$", () => {
    const funcoes = [...sql.matchAll(/create or replace function/g)];
    const corpos = [...sql.matchAll(/as \$\$[\s\S]*?\$\$;/g)];
    expect(funcoes.length).toBeGreaterThan(0);
    expect(corpos.length).toBe(funcoes.length);
    expect(sql).not.toMatch(/^\s*as \$\s*$/m);
  });

  it("toda política é precedida por drop policy if exists", () => {
    const criadas = [...sql.matchAll(/create policy\s+(\w+)\s+on\s+([\w.]+)/g)];
    expect(criadas.length).toBeGreaterThan(0);
    for (const [, nome, tabela] of criadas) {
      expect(sql).toContain(`drop policy if exists ${nome} on ${tabela};`);
    }
  });

  it.each(TABELAS)("ativa RLS e revoga anon em %s", (tabela) => {
    expect(sql).toContain(
      `alter table public.${tabela} enable row level security;`,
    );
    expect(sql).toContain(`revoke all on table public.${tabela} from anon;`);
  });

  it("nenhuma política para anon ou public; todas para authenticated", () => {
    const todas = [...sql.matchAll(/create policy[^;]*;/g)].map((m) => m[0]);
    for (const politica of todas) {
      expect(politica).toMatch(/\bto authenticated\b/);
      expect(politica).not.toMatch(/\bto (anon|public)\b/);
    }
  });

  it("estoque_atual é só leitura para authenticated", () => {
    const politicas = politicasDe(sql, "estoque_atual");
    expect(politicas.length).toBe(1);
    expect(politicas[0]).toMatch(/for select/);
    expect(sql).toContain(
      "grant select on table public.estoque_atual to authenticated;",
    );
    expect(sql).not.toMatch(
      /grant[^;]*(insert|update|delete)[^;]*public\.estoque_atual/,
    );
  });

  it.each(["requisicoes", "requisicao_itens"])(
    "%s não permite update nem delete",
    (tabela) => {
      for (const p of politicasDe(sql, tabela)) {
        expect(p).not.toMatch(/for (update|delete|all)/);
      }
      expect(sql).not.toMatch(
        new RegExp(`grant[^;]*(update|delete)[^;]*public\\.${tabela}\\b`),
      );
    },
  );

  it.each(["lojas", "produtos"])(
    "%s tem coluna ativo e não permite delete",
    (tabela) => {
      expect(sql).toMatch(
        new RegExp(
          `create table if not exists public\\.${tabela} \\([^;]*ativo boolean not null default true`,
        ),
      );
      for (const p of politicasDe(sql, tabela)) {
        expect(p).not.toMatch(/for (delete|all)/);
      }
    },
  );

  it.each(["contagens", "contagem_itens"])(
    "%s só altera ou apaga com status rascunho",
    (tabela) => {
      const politicas = politicasDe(sql, tabela).filter((p) =>
        /for (insert|update|delete)/.test(p),
      );
      expect(politicas.length).toBeGreaterThan(0);
      for (const p of politicas) {
        expect(p).toContain("status = 'rascunho'");
      }
    },
  );

  it("escolha de omitidos é coluna da contagem (manter ou zerar)", () => {
    expect(sql).toMatch(
      /omitidos text[^,]*check \(omitidos in \('manter', 'zerar'\)\)/,
    );
  });

  it("quantidades são inteiras em unidades e datas com timestamptz", () => {
    expect(sql).not.toMatch(/\b(numeric|decimal|real|double precision)\b/);
    expect(sql).not.toMatch(/\bcaixas\b/);
    expect(sql).toMatch(/quantidade_unidades integer not null/);
    expect(sql).toMatch(/data_contagem timestamptz not null/);
    expect(sql).toMatch(/data_movimento timestamptz not null/);
    expect(sql).not.toMatch(/\btimestamp(?!tz)\b/);
  });

  it("FKs para lojas e produtos são restrict", () => {
    const fks = [
      ...sql.matchAll(/references public\.(lojas|produtos) \(id\)[^,\n]*/g),
    ];
    expect(fks.length).toBeGreaterThan(0);
    for (const [fk] of fks) {
      expect(fk).toContain("on delete restrict");
    }
  });

  it.each(["requisicoes", "requisicao_itens"])(
    "%s é só leitura para authenticated (gravação só por função)",
    (tabela) => {
      const politicas = politicasDe(sql, tabela);
      expect(politicas.length).toBe(1);
      expect(politicas[0]).toMatch(/for select/);
      expect(sql).toContain(
        `grant select on table public.${tabela} to authenticated;`,
      );
      expect(sql).not.toMatch(
        new RegExp(
          `grant[^;]*(insert|update|delete)[^;]*public\\.${tabela}\\b`,
        ),
      );
    },
  );

  it.each(["contagens", "requisicoes"])(
    "%s.criado_por é obrigatório, referencia auth.users e vem de trigger",
    (tabela) => {
      expect(sql).toMatch(
        new RegExp(
          `create table if not exists public\\.${tabela} \\([^;]*criado_por uuid not null references auth\\.users \\(id\\)`,
        ),
      );
      expect(sql).toContain(
        `drop trigger if exists ${tabela}_definir_criado_por on public.${tabela};`,
      );
      expect(sql).toMatch(
        new RegExp(
          `create trigger ${tabela}_definir_criado_por\\s+before insert or update on public\\.${tabela}\\s+for each row execute function public\\.definir_criado_por\\(\\)`,
        ),
      );
    },
  );

  it("trigger de criado_por usa auth.uid() e preserva o autor no update", () => {
    expect(sql).toContain(
      "create or replace function public.definir_criado_por()",
    );
    expect(sql).toMatch(/new\.criado_por := auth\.uid\(\)/);
    expect(sql).toMatch(/new\.criado_por := old\.criado_por/);
    expect(sql).toMatch(/set search_path = ''/);
  });

  it("contagem confirmada exige escolha de omitidos", () => {
    expect(sql).toContain(
      "check (status <> 'confirmada' or omitidos is not null)",
    );
  });

  it("só uma contagem inicial por loja", () => {
    expect(sql).toMatch(
      /create unique index if not exists \w+\s+on public\.contagens \(loja_id\) where inicial;/,
    );
  });

  it("índice de destino é parcial", () => {
    expect(sql).toMatch(
      /create index if not exists requisicoes_destino_data_idx\s+on public\.requisicoes \(loja_destino_id, data_movimento desc\)\s+where loja_destino_id is not null;/,
    );
  });

  it("nome de loja e sku são únicos sem diferenciar maiúsculas e espaços", () => {
    expect(sql).toMatch(
      /create unique index if not exists \w+\s+on public\.lojas \(lower\(trim\(nome\)\)\);/,
    );
    expect(sql).toMatch(
      /create unique index if not exists \w+\s+on public\.produtos \(lower\(trim\(sku\)\)\);/,
    );
  });

  it("contagem_itens.contagem_id é restrict, com nome explícito e idempotente", () => {
    expect(sql).not.toMatch(/contagem_id uuid not null references/);
    expect(sql).toContain(
      "alter table public.contagem_itens drop constraint if exists contagem_itens_contagem_id_fkey;",
    );
    expect(sql).toMatch(
      /alter table public\.contagem_itens\s+add constraint contagem_itens_contagem_id_fkey\s+foreign key \(contagem_id\) references public\.contagens \(id\) on delete restrict;/,
    );
    expect(sql).not.toMatch(/on delete cascade/);
  });

  it("authenticated não grava inicial = true em contagens (insert e update)", () => {
    const politicas = politicasDe(sql, "contagens");
    const insert = politicas.find((p) => /for insert/.test(p));
    const update = politicas.find((p) => /for update/.test(p));
    expect(insert).toMatch(
      /with check \(status = 'rascunho' and not inicial\)/,
    );
    expect(update).toMatch(
      /with check \(status = 'rascunho' and not inicial\)/,
    );
  });

  it("transferência rejeita origem igual ao destino", () => {
    expect(sql).toMatch(/loja_destino_id is distinct from loja_id/);
  });
});
