// Lê um .md de .claude/knowledge/, quebra em chunks (~200-300 tokens), gera embeddings
// (all-MiniLM-L6-v2) e grava em rag.db com agent e category.
// Uso:
//   node .claude/scripts/embed.ts <arquivo.md>
//   node .claude/scripts/embed.ts --nota "texto" --categoria bug --agent orquestrador [--titulo "x"]
//   node .claude/scripts/embed.ts --reindexar        (refaz o banco a partir dos .md)
import { createHash } from "node:crypto";
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import {
  abrirBanco,
  argumento,
  CATEGORIAS,
  type Categoria,
  config,
  DIR_KNOWLEDGE,
  embedar,
  hoje,
  paraBytes,
  RAIZ,
  redigir,
  slug,
  temFlag,
} from "./lib.ts";

type Chunk = { category: Categoria; content: string };

// Junta parágrafos/itens até ~max caracteres (≈250 tokens); itens grandes são cortados.
export function dividir(texto: string): string[] {
  const { min, max } = config.chunkCaracteres;
  const partes = texto
    .split(/\n(?=- |\n)/)
    .map((p) => p.trim())
    .filter(Boolean)
    .flatMap((p) =>
      p.length > max
        ? (p.match(new RegExp(`[\\s\\S]{1,${max}}`, "g")) ?? [p])
        : [p],
    );
  const chunks: string[] = [];
  let atual = "";
  for (const p of partes) {
    if (atual && atual.length + p.length + 1 > max) {
      chunks.push(atual);
      atual = "";
    }
    atual = atual ? `${atual}\n${p}` : p;
    if (atual.length >= min) {
      chunks.push(atual);
      atual = "";
    }
  }
  if (atual) chunks.push(atual);
  return chunks;
}

export function lerArquivo(texto: string): {
  agent: string;
  data: string;
  chunks: Chunk[];
} {
  const m = texto.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  const cab = m?.[1] ?? "";
  const corpo = m?.[2] ?? texto;
  const meta = (k: string) =>
    cab.match(new RegExp(`^${k}:\\s*(.+)$`, "m"))?.[1]?.trim();
  const chunks: Chunk[] = [];
  for (const secao of corpo.split(/^##\s+/m).slice(1)) {
    const [titulo = "", ...resto] = secao.split("\n");
    const category = titulo.trim().toLowerCase() as Categoria;
    if (!CATEGORIAS.includes(category)) continue;
    for (const content of dividir(resto.join("\n")))
      chunks.push({ category, content });
  }
  return {
    agent: meta("agent") ?? "sessao",
    data: meta("data") ?? hoje(),
    chunks,
  };
}

export async function indexar(arquivo: string): Promise<number> {
  const { agent, data, chunks } = lerArquivo(readFileSync(arquivo, "utf8"));
  if (!chunks.length) return 0;
  const db = abrirBanco();
  const rel = path.relative(RAIZ, arquivo).replaceAll("\\", "/");
  const existe = db.prepare("SELECT 1 FROM knowledge WHERE hash = ?");
  const novos = chunks
    .map((c) => {
      const content = redigir(c.content);
      const hash = createHash("sha1")
        .update(`${c.category}|${content}`)
        .digest("hex");
      return { category: c.category, content, hash };
    })
    .filter((c) => !existe.get(c.hash));
  const vetores = await embedar(novos.map((c) => c.content));
  const inserir = db.prepare(
    "INSERT INTO knowledge (path, content, embedding, category, agent, created_at, hash) VALUES (?, ?, ?, ?, ?, ?, ?)",
  );
  const inserirVec = db.prepare(
    "INSERT INTO knowledge_vec (rowid, embedding) VALUES (?, ?)",
  );
  db.exec("BEGIN");
  try {
    novos.forEach((c, i) => {
      const v = paraBytes(vetores[i] as Float32Array);
      const r = inserir.run(rel, c.content, v, c.category, agent, data, c.hash);
      inserirVec.run(BigInt(r.lastInsertRowid), v);
    });
    db.exec("COMMIT");
  } catch (e) {
    db.exec("ROLLBACK");
    throw e;
  }
  db.close();
  return novos.length;
}

export function gravarNota(
  texto: string,
  categoria: Categoria,
  agent: string,
  titulo?: string,
): string {
  mkdirSync(DIR_KNOWLEDGE, { recursive: true });
  const arquivo = path.join(
    DIR_KNOWLEDGE,
    `${hoje()}-${slug(agent)}-${slug(titulo ?? texto.slice(0, 30))}.md`,
  );
  writeFileSync(
    arquivo,
    `---\nagent: ${agent}\ndata: ${hoje()}\norigem: nota\n---\n\n## ${categoria}\n${redigir(texto)}\n`,
  );
  return arquivo;
}

async function principal() {
  const nota = argumento("nota");
  if (temFlag("reindexar")) {
    const db = abrirBanco();
    db.exec("DELETE FROM knowledge; DELETE FROM knowledge_vec;");
    db.close();
    let total = 0;
    for (const f of readdirSync(DIR_KNOWLEDGE).filter((n) => n.endsWith(".md")))
      total += await indexar(path.join(DIR_KNOWLEDGE, f));
    console.log(`Reindexado: ${total} chunks.`);
  } else if (nota) {
    const categoria = (argumento("categoria") ?? "feature") as Categoria;
    if (!CATEGORIAS.includes(categoria))
      throw new Error(`categoria inválida; use: ${CATEGORIAS.join(", ")}`);
    const arquivo = gravarNota(
      nota,
      categoria,
      argumento("agent") ?? "orquestrador",
      argumento("titulo"),
    );
    console.log(
      `Registrado: ${path.relative(RAIZ, arquivo)} (${await indexar(arquivo)} chunks)`,
    );
  } else {
    const arquivo = process.argv[2];
    if (!arquivo || arquivo.startsWith("--"))
      throw new Error("informe o arquivo .md, --nota ou --reindexar");
    console.log(`${await indexar(path.resolve(arquivo))} chunks gravados.`);
  }
}

if (process.argv[1]?.endsWith("embed.ts")) {
  principal().catch((e) => {
    console.error(`embed: ${e instanceof Error ? e.message : e}`);
    process.exit(1);
  });
}
