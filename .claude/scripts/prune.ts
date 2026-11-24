// Poda do rag.db: remove chunks duplicados (similaridade muito alta) e entradas obsoletas.
// Uso:
//   node .claude/scripts/prune.ts                      (simulação: só lista o que removeria)
//   node .claude/scripts/prune.ts --aplicar            (remove de fato)
//   node .claude/scripts/prune.ts --listar             (lista chunks: id, categoria, agent, início)
//   node .claude/scripts/prune.ts --marcar-obsoleto 12 (marca o chunk 12; sairá na próxima poda)
// Os .md em .claude/knowledge/ não são apagados; --reindexar em embed.ts os traria de volta.
import {
  abrirBanco,
  argumento,
  config,
  cosseno,
  deBytes,
  temFlag,
} from "./lib.ts";

type Linha = {
  id: number;
  content: string;
  category: string;
  agent: string;
  created_at: string;
  status: string;
  embedding: Uint8Array;
};

const db = abrirBanco();
const marcar = argumento("marcar-obsoleto");

if (marcar) {
  const r = db
    .prepare("UPDATE knowledge SET status = 'obsoleto' WHERE id = ?")
    .run(Number(marcar));
  console.log(
    r.changes
      ? `Chunk ${marcar} marcado como obsoleto.`
      : `Chunk ${marcar} não existe.`,
  );
  process.exit(0);
}

const linhas = db
  .prepare("SELECT * FROM knowledge ORDER BY id")
  .all() as unknown as Linha[];

if (temFlag("listar")) {
  for (const l of linhas)
    console.log(
      `#${l.id} [${l.status}] ${l.category} | ${l.agent} | ${l.created_at} | ${l.content.replace(/\s+/g, " ").slice(0, 80)}`,
    );
  console.log(`${linhas.length} chunks.`);
  process.exit(0);
}

const remover = new Map<number, string>();
for (const l of linhas)
  if (l.status === "obsoleto") remover.set(l.id, "obsoleto");

const ativos = linhas
  .filter((l) => l.status === "ativo")
  .map((l) => ({ ...l, v: deBytes(l.embedding) }));
for (let i = 0; i < ativos.length; i++) {
  for (let j = i + 1; j < ativos.length; j++) {
    const a = ativos[i];
    const b = ativos[j];
    if (!a || !b || remover.has(a.id) || remover.has(b.id)) continue;
    if (cosseno(a.v, b.v) >= config.limiarDuplicado)
      remover.set(a.id, `duplicado do #${b.id} (mantém o mais novo)`);
  }
}

if (!remover.size) {
  console.log("Nada para podar.");
} else {
  for (const [id, motivo] of remover) console.log(`#${id}: ${motivo}`);
  if (temFlag("aplicar")) {
    db.exec("BEGIN");
    const delK = db.prepare("DELETE FROM knowledge WHERE id = ?");
    const delV = db.prepare("DELETE FROM knowledge_vec WHERE rowid = ?");
    for (const id of remover.keys()) {
      delK.run(id);
      delV.run(BigInt(id));
    }
    db.exec("COMMIT");
    console.log(`${remover.size} chunks removidos.`);
  } else {
    console.log(
      `${remover.size} chunks seriam removidos. Rode com --aplicar para remover.`,
    );
  }
}
db.close();
