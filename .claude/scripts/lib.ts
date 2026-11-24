// Utilitários do RAG de memória do projeto (rag.db + .claude/knowledge/).
// Roda com Node 24 (type stripping): node .claude/scripts/<script>.ts
import { readFileSync } from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { fileURLToPath } from "node:url";
import * as sqliteVec from "sqlite-vec";

export const RAIZ = process.env.CLAUDE_PROJECT_DIR || process.cwd();
export const DIR_SCRIPTS = path.dirname(fileURLToPath(import.meta.url));
export const DIR_KNOWLEDGE = path.join(RAIZ, ".claude", "knowledge");
export const DB_PATH = path.join(RAIZ, "rag.db");

export const CATEGORIAS = [
  "bug",
  "decisao",
  "padrao",
  "nao-funcionou",
  "feature",
] as const;
export type Categoria = (typeof CATEGORIAS)[number];

export type Config = {
  modelo: string;
  dimensoes: number;
  limiarSimilaridade: number;
  limiarDuplicado: number;
  maxChunksInjetados: number;
  maxCaracteresPorChunk: number;
  chunkCaracteres: { min: number; max: number };
  afinidadeCategoria: Record<string, string[]>;
  bonusMesmoAgent: number;
  bonusCategoria: number;
  modeloResumo: string;
  maxCaracteresTranscript: number;
};

export const config: Config = JSON.parse(
  readFileSync(path.join(DIR_SCRIPTS, "rag.config.json"), "utf8"),
);

export function abrirBanco(): DatabaseSync {
  const db = new DatabaseSync(DB_PATH, { allowExtension: true });
  db.loadExtension(sqliteVec.getLoadablePath());
  db.exec(`
    CREATE TABLE IF NOT EXISTS knowledge (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      path TEXT NOT NULL,
      content TEXT NOT NULL,
      embedding BLOB NOT NULL,
      category TEXT NOT NULL,
      agent TEXT NOT NULL,
      created_at TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'ativo',
      hash TEXT NOT NULL UNIQUE
    );
    CREATE INDEX IF NOT EXISTS knowledge_status ON knowledge(status);
    CREATE VIRTUAL TABLE IF NOT EXISTS knowledge_vec USING vec0(
      embedding float[${config.dimensoes}]
    );
  `);
  return db;
}

export const paraBytes = (v: Float32Array) =>
  new Uint8Array(v.buffer, v.byteOffset, v.byteLength);

export const deBytes = (b: Uint8Array) =>
  new Float32Array(b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength));

export const cosseno = (a: Float32Array, b: Float32Array) => {
  let s = 0;
  for (let i = 0; i < a.length; i++) s += (a[i] ?? 0) * (b[i] ?? 0);
  return s; // vetores já normalizados
};

type Extrator = (
  texto: string | string[],
  opcoes: { pooling: "mean"; normalize: boolean },
) => Promise<{ data: Float32Array; dims: number[] }>;
let extrator: Extrator | null = null;

// all-MiniLM-L6-v2 rodando local; o modelo é baixado uma vez para .claude/.cache/modelos.
export async function embedar(textos: string[]): Promise<Float32Array[]> {
  if (!extrator) {
    const { pipeline, env } = await import("@huggingface/transformers");
    env.cacheDir = path.join(RAIZ, ".claude", ".cache", "modelos");
    extrator = (await pipeline("feature-extraction", config.modelo, {
      dtype: "q8",
    })) as unknown as Extrator;
  }
  const saida: Float32Array[] = [];
  for (const t of textos) {
    const r = await extrator(t, { pooling: "mean", normalize: true });
    saida.push(Float32Array.from(r.data));
  }
  return saida;
}

// Remove segredos e dados pessoais antes de gravar ou enviar texto a um modelo.
export function redigir(texto: string): string {
  return texto
    .replace(/\beyJ[\w-]{10,}\.[\w-]{10,}\.[\w-]{10,}/g, "[JWT]")
    .replace(/\b(sk|sb|pk|ghp|gho|xox[bap])[-_][\w-]{16,}/gi, "[CHAVE]")
    .replace(
      /\b([A-Z][A-Z0-9_]*(KEY|SECRET|TOKEN|PASSWORD|SENHA)[A-Z0-9_]*)\s*[=:]\s*\S+/g,
      "$1=[REMOVIDO]",
    )
    .replace(/[\w.+-]+@[\w-]+\.[\w.-]+/g, "[EMAIL]");
}

export const slug = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40) || "sessao";

export const hoje = () => new Date().toISOString().slice(0, 10);

export function lerStdin(): string {
  try {
    return readFileSync(0, "utf8");
  } catch {
    return "";
  }
}

export function argumento(nome: string): string | undefined {
  const i = process.argv.indexOf(`--${nome}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
}
export const temFlag = (nome: string) => process.argv.includes(`--${nome}`);
