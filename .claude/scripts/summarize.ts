// Resume um transcript (agent ou sessão) em aprendizados e salva em .claude/knowledge/.
// Usa o Claude Code em modo headless com o modelo barato (config.modeloResumo), sem ferramentas.
// Uso: node .claude/scripts/summarize.ts --transcript <jsonl> --agent <nome> --session <id> [--origem sessao|agent]
// Imprime o caminho do arquivo gerado (ou nada, se não houve aprendizado).
import { spawnSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import {
  argumento,
  CATEGORIAS,
  config,
  DIR_KNOWLEDGE,
  hoje,
  redigir,
  slug,
} from "./lib.ts";

type Bloco = { type?: string; text?: string };
type Linha = { type?: string; message?: { content?: string | Bloco[] } };

// Só o texto da conversa (sem resultados de ferramenta, que são enormes e podem ter segredos).
export function extrairConversa(jsonl: string): string {
  const falas: string[] = [];
  for (const linha of jsonl.split("\n")) {
    if (!linha.trim()) continue;
    let obj: Linha;
    try {
      obj = JSON.parse(linha) as Linha;
    } catch {
      continue;
    }
    if (obj.type !== "user" && obj.type !== "assistant") continue;
    const c = obj.message?.content;
    const texto =
      typeof c === "string"
        ? c
        : (c ?? [])
            .filter((b) => b.type === "text" && b.text)
            .map((b) => b.text)
            .join("\n");
    if (texto.trim())
      falas.push(
        `${obj.type === "user" ? "Usuário" : "Assistente"}: ${texto.trim()}`,
      );
  }
  return falas.join("\n\n");
}

const PROMPT = `Você extrai aprendizados reutilizáveis de uma conversa de desenvolvimento de software (projeto EstoqueFácil: Next.js, Supabase, estoque de lojas).
Responda SOMENTE em português, neste formato exato, omitindo seções vazias:

## bug
- <bug resolvido: sintoma, causa raiz e correção, em uma ou duas frases>
## decisao
- <decisão de arquitetura ou regra e o PORQUÊ>
## padrao
- <padrão adotado pelo time>
## nao-funcionou
- <o que foi tentado e não funcionou, e por quê>
## feature
- <funcionalidade entregue e como foi feita (arquivos/funções principais)>

Regras: cada item deve fazer sentido sozinho (sem "como dito acima"), ter no máximo 3 frases e conter nomes de arquivos/funções quando houver. Não inclua segredos, chaves, e-mails nem trechos longos de código. Não invente: use só o que está na conversa. Se não houver nada reutilizável, responda exatamente: NADA

Conversa:
`;

// Acha o executável do Claude Code: CLAUDE_BIN, depois o PATH, depois a instalação npm global do Windows.
function acharClaude(): string {
  const candidatos = [
    process.env.CLAUDE_BIN,
    "claude",
    process.env.APPDATA
      ? `"${path.join(process.env.APPDATA, "npm", "claude.cmd")}"`
      : undefined,
  ].filter((c): c is string => Boolean(c));
  for (const c of candidatos) {
    const t = spawnSync(c, ["--version"], {
      shell: true,
      windowsHide: true,
      encoding: "utf8",
      timeout: 20_000,
    });
    if (t.status === 0) return c;
  }
  throw new Error(
    "executável do Claude Code não encontrado; defina CLAUDE_BIN",
  );
}

function resumir(conversa: string): string {
  const r = spawnSync(
    acharClaude(),
    ["-p", "--model", config.modeloResumo, "--tools", '""'],
    {
      input: PROMPT + conversa,
      windowsHide: true,
      encoding: "utf8",
      shell: true,
      cwd: tmpdir(), // fora do projeto: não carrega CLAUDE.md, agent principal nem hooks
      env: { ...process.env, RAG_CAPTURANDO: "1" },
      timeout: 120_000,
    },
  );
  if (r.status !== 0)
    throw new Error(`claude -p falhou: ${r.stderr?.slice(0, 200)}`);
  return r.stdout.trim();
}

function principal() {
  const transcript = argumento("transcript");
  const agent = argumento("agent") ?? "sessao";
  const sessao = (argumento("session") ?? "x").slice(0, 6);
  if (!transcript) throw new Error("informe --transcript");
  const conversa = redigir(extrairConversa(readFileSync(transcript, "utf8")));
  if (conversa.length < 1500) return; // conversa curta demais para render aprendizado
  const recorte = conversa.slice(-config.maxCaracteresTranscript);
  const saida = redigir(resumir(recorte));
  if (!saida || /^NADA\b/.test(saida)) return;
  const secoes = saida
    .split(/^##\s+/m)
    .slice(1)
    .filter((s) =>
      CATEGORIAS.some((c) => s.trim().toLowerCase().startsWith(c)),
    );
  if (!secoes.length) return;
  mkdirSync(DIR_KNOWLEDGE, { recursive: true });
  const arquivo = path.join(
    DIR_KNOWLEDGE,
    `${hoje()}-${slug(agent)}-${slug(sessao)}.md`,
  );
  const origem = argumento("origem") ?? "sessao";
  writeFileSync(
    arquivo,
    `---\nagent: ${agent}\ndata: ${hoje()}\norigem: ${origem}\n---\n\n${secoes.map((s) => `## ${s.trim()}`).join("\n\n")}\n`,
  );
  console.log(arquivo);
}

if (process.argv[1]?.endsWith("summarize.ts")) {
  try {
    principal();
  } catch (e) {
    console.error(`summarize: ${e instanceof Error ? e.message : e}`);
    process.exit(1);
  }
}
