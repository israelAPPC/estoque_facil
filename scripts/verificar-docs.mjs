// Verificação cruzada SPEC <-> PLAN <-> CLAUDE <-> PENDENCIAS <-> agents (somente leitura).
// Uso: node scripts/verificar-docs.mjs            (relatório completo; exit 1 se houver ERRO)
//      node scripts/verificar-docs.mjs --aviso    (só resumo curto; sempre exit 0; usado pelo hook)
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

const RAIZ = process.env.CLAUDE_PROJECT_DIR || process.cwd();
const ler = (p) => {
  const c = path.join(RAIZ, p);
  return existsSync(c) ? readFileSync(c, "utf8") : "";
};
const tam = (p) =>
  existsSync(path.join(RAIZ, p)) ? statSync(path.join(RAIZ, p)).size : 0;
const listar = (dir, ext) => {
  const d = path.join(RAIZ, dir);
  if (!existsSync(d)) return [];
  return readdirSync(d, { withFileTypes: true }).flatMap((e) => {
    const rel = `${dir}/${e.name}`;
    return e.isDirectory()
      ? listar(rel, ext)
      : e.name.endsWith(ext)
        ? [rel]
        : [];
  });
};

const erros = [];
const futuros = new Set(); // docs de módulo e saídas de agents ainda não criados (não é erro)
const avisos = [];
const erro = (m) => erros.push(m);
const aviso = (m) => avisos.push(m);
const KB = 1024;

// a) caminhos docs/... e .claude/... citados existem
const documentos = [
  "CLAUDE.md",
  "SPEC.md",
  "PLAN.md",
  "PENDENCIAS.md",
  ...listar("docs/pendencias", ".md"),
  ...listar(".claude/rules", ".md"),
  ...listar(".claude/agents", ".md"),
  ...listar(".claude/commands", ".md"),
];
const RE_CAMINHO =
  /(?<![\w/])((?:docs|\.claude)\/[\w.\-/]+\.(?:md|json|mjs|ts))/g;
for (const doc of documentos) {
  const linhas = ler(doc).split("\n");
  linhas.forEach((linha, i) => {
    // PLAN descreve arquivos que a task ainda vai criar (Output); não conta como caminho quebrado
    if (doc === "PLAN.md" && /^\s*-\s*Output:/.test(linha)) return;
    for (const m of linha.matchAll(RE_CAMINHO)) {
      const alvo = m[1].replace(/[.,;:)]+$/, "");
      if (
        alvo.includes("<") ||
        alvo.includes("NNNN") ||
        alvo.includes("_backup") ||
        existsSync(path.join(RAIZ, alvo))
      )
        continue;
      // doc de módulo e arquivos que agents/comandos vão criar ainda não existem: não é erro
      if (
        /^docs\/modulos\/[\w-]+\.md$/.test(alvo) ||
        doc.startsWith(".claude/agents/") ||
        doc.startsWith(".claude/commands/")
      )
        futuros.add(alvo);
      else erro(`${doc}:${i + 1} caminho inexistente: ${alvo}`);
    }
  });
}

if (futuros.size)
  aviso(
    `${futuros.size} arquivo(s) citado(s) ainda não criado(s) (docs de módulo e saídas de agents): ${[...futuros].sort().join(", ")}`,
  );

// b) IDs do critério de conclusão do PLAN existem nas pendências
const PEND = [
  ler("PENDENCIAS.md"),
  ...listar("docs/pendencias", ".md").map(ler),
  ler("docs/pendencias-resolvidas.md"),
].join("\n");
const idsPlan = [
  ...new Set(
    [...ler("PLAN.md").matchAll(/\b([A-Z]{2,5}-\d{3})\b/g)].map((m) => m[1]),
  ),
];
for (const id of idsPlan)
  if (!PEND.includes(id))
    erro(
      `PLAN.md cita o ID ${id}, que não existe em PENDENCIAS.md, docs/pendencias/ nem pendencias-resolvidas.md`,
    );

// c) exceções de escrita idênticas (só se o projeto grava em sistema externo)
if (existsSync(path.join(RAIZ, "docs/seguranca-excecoes-escrita.md"))) {
  const nomes = (t) =>
    [...t.matchAll(/EXCECAO-[\w-]+/g)]
      .map((m) => m[0])
      .sort()
      .join(",");
  const [a, b, c] = [
    ler("SPEC.md"),
    ler(".claude/rules/seguranca.md"),
    ler("docs/seguranca-excecoes-escrita.md"),
  ].map(nomes);
  if (a !== b || b !== c)
    erro(
      "lista de exceções de escrita diferente entre SPEC.md, seguranca.md e seguranca-excecoes-escrita.md",
    );
}

// d) Índice de módulos do CLAUDE.md x tabela de módulos do SPEC.md
const docsMod = (t) =>
  new Set([...t.matchAll(/docs\/modulos\/([\w-]+)\.md/g)].map((m) => m[1]));
const noClaude = docsMod(ler("CLAUDE.md"));
const noSpec = docsMod(ler("SPEC.md"));
for (const m of noClaude)
  if (!noSpec.has(m))
    aviso(
      `módulo ${m}: está no índice do CLAUDE.md mas não na tabela do SPEC.md`,
    );
for (const m of noSpec)
  if (!noClaude.has(m))
    aviso(`módulo ${m}: está no SPEC.md mas não no índice do CLAUDE.md`);

// e) orçamentos de tamanho e títulos truncados
if (tam("CLAUDE.md") > 10 * KB)
  aviso(`CLAUDE.md com ${(tam("CLAUDE.md") / KB).toFixed(1)} KB (alvo ~10 KB)`);
if (tam("SPEC.md") > 10 * KB)
  aviso(`SPEC.md com ${(tam("SPEC.md") / KB).toFixed(1)} KB (alvo ~10 KB)`);
if (tam("PENDENCIAS.md") > 25 * KB)
  aviso(
    `PENDENCIAS.md com ${(tam("PENDENCIAS.md") / KB).toFixed(1)} KB (alvo ~25 KB)`,
  );
let incond = 0;
for (const r of listar(".claude/rules", ".md")) {
  const t = ler(r);
  const cab = t.startsWith("---") ? (t.split("---")[1] ?? "") : "";
  if (!/^paths:/m.test(cab)) incond += Buffer.byteLength(t);
}
if (incond > 12 * KB)
  aviso(
    `rules incondicionais somam ${(incond / KB).toFixed(1)} KB (alvo ~12 KB)`,
  );
for (const [i, l] of ler("PENDENCIAS.md").split("\n").entries()) {
  if (
    /^- \[ \] \*\*/.test(l) &&
    (/…\s*\(origem/.test(l) || /\s—\s\S{1,3}$/.test(l))
  )
    erro(`PENDENCIAS.md:${i + 1} título truncado`);
}

// f) Resumo do PENDENCIAS.md bate com o corpo; IDs únicos e presentes no detalhe
const principal = ler("PENDENCIAS.md");
const idsDetalhe = [];
const prios = { P0: 0, P1: 0, P2: 0, P3: 0 };
for (const f of listar("docs/pendencias", ".md").filter(
  (x) => !x.includes("_registro"),
)) {
  const t = ler(f);
  for (const m of t.matchAll(/^### ([A-Z]+-\d+):/gm)) idsDetalhe.push(m[1]);
  for (const m of t.matchAll(/^\*\*(P[0-3]) · /gm)) prios[m[1]]++;
}
for (const id of idsDetalhe.filter((x, i) => idsDetalhe.indexOf(x) !== i))
  erro(`ID duplicado nos arquivos de detalhe: ${id}`);
for (const m of principal.matchAll(/\*\*P[0-3] · \w+ · ([A-Z]+-\d+)\*\*/g)) {
  if (!idsDetalhe.includes(m[1]))
    erro(`${m[1]} está em PENDENCIAS.md mas não existe em docs/pendencias/`);
}
const resumo = principal.match(
  /Abertos: (\d+) \(P0: (\d+) · P1: (\d+) · P2: (\d+) · P3: (\d+)\)/,
);
if (!resumo) erro("PENDENCIAS.md sem a linha 'Abertos: N (P0: ...)' no Resumo");
else {
  const esperado = [
    idsDetalhe.length,
    prios.P0,
    prios.P1,
    prios.P2,
    prios.P3,
  ].join(",");
  if (resumo.slice(1).join(",") !== esperado)
    erro(
      `Resumo do PENDENCIAS.md (${resumo.slice(1).join(",")}) não bate com o corpo (${esperado})`,
    );
}
for (const id of idsDetalhe)
  if (PEND.split(`**${id}**`).length > 3)
    aviso(`${id} aparece mais de uma vez no PENDENCIAS.md`);

// g) todo agent aparece no catálogo do orquestrador
const orq = ler(".claude/agents/orquestrador.md");
for (const f of listar(".claude/agents", ".md")) {
  const nome = path.basename(f, ".md");
  if (nome !== "orquestrador" && !new RegExp(`\\|\\s*${nome}\\s*\\|`).test(orq))
    erro(`agent ${nome} não está no catálogo do orquestrador`);
}

// h) nome do produto consistente
const nome = (t) => t.match(/EstoqueF[áa]cil/i)?.[0];
if (!nome(ler("CLAUDE.md")))
  aviso("CLAUDE.md não cita o nome do produto (EstoqueFácil)");

if (process.argv.includes("--aviso")) {
  if (erros.length || avisos.length) {
    process.stdout.write(
      `verificar-docs: ${erros.length} erro(s), ${avisos.length} aviso(s). ${erros.slice(0, 3).join(" | ")}`,
    );
  }
  process.exit(0);
}
for (const e of erros) console.log(`ERRO  ${e}`);
for (const a of avisos) console.log(`AVISO ${a}`);
console.log(
  `\nverificar-docs: ${erros.length} erro(s), ${avisos.length} aviso(s).`,
);
process.exit(erros.length ? 1 : 0);
