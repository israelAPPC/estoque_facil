// Ponto de entrada dos hooks do RAG. Falha sempre aberto (exit 0): memória nunca trava o trabalho.
//   node .claude/scripts/hook.ts subagent-stop   (SubagentStop: aprendizado do agent)
//   node .claude/scripts/hook.ts session-end     (SessionEnd: síntese da sessão)
//   node .claude/scripts/hook.ts prompt          (UserPromptSubmit: injeta memória relevante)
// subagent-stop e session-end só disparam um processo em segundo plano e saem na hora.
import { spawn, spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { DB_PATH, lerStdin, RAIZ } from "./lib.ts";

type Entrada = {
  session_id?: string;
  transcript_path?: string;
  agent_transcript_path?: string;
  agent_type?: string;
  prompt?: string;
};

const modo = process.argv[2];
const noRag = process.env.RAG_CAPTURANDO === "1"; // evita laço: o resumo roda um claude -p
let entrada: Entrada = {};
try {
  entrada = JSON.parse(lerStdin() || "{}") as Entrada;
} catch {
  process.exit(0);
}

async function prompt() {
  const texto = entrada.prompt ?? "";
  const { buscar, ehTrivial, formatar } = await import("./search.ts");
  if (ehTrivial(texto) || !existsSync(DB_PATH)) return;
  const achados = await buscar(texto, entrada.agent_type ?? "orquestrador");
  const contexto = formatar(achados);
  if (!contexto) return;
  process.stdout.write(
    JSON.stringify({
      hookSpecificOutput: {
        hookEventName: "UserPromptSubmit",
        additionalContext: contexto,
      },
    }),
  );
}

// Processo em segundo plano: resume e indexa. Nada aqui bloqueia o Claude Code.
function capturar(origem: "agent" | "sessao") {
  const transcript =
    origem === "agent"
      ? (entrada.agent_transcript_path ?? entrada.transcript_path)
      : entrada.transcript_path;
  if (!transcript) return;
  const agent = origem === "agent" ? (entrada.agent_type ?? "agent") : "sessao";
  const filho = spawn(
    process.execPath,
    [
      fileURLToPath(import.meta.url),
      "worker",
      transcript,
      agent,
      entrada.session_id ?? "x",
      origem,
    ],
    {
      detached: true,
      stdio: "ignore",
      windowsHide: true,
      cwd: RAIZ,
      env: { ...process.env, RAG_CAPTURANDO: "1" },
    },
  );
  filho.unref();
}

function worker() {
  const [transcript = "", agent = "", sessao = "", origem = ""] =
    process.argv.slice(3);
  const aqui = (n: string) => fileURLToPath(new URL(n, import.meta.url));
  const r = spawnSync(
    process.execPath,
    [
      aqui("./summarize.ts"),
      "--transcript",
      transcript,
      "--agent",
      agent,
      "--session",
      sessao,
      "--origem",
      origem,
    ],
    { encoding: "utf8", env: process.env },
  );
  const arquivo = r.stdout?.trim().split("\n").pop();
  if (r.status === 0 && arquivo)
    spawnSync(process.execPath, [aqui("./embed.ts"), arquivo], {
      encoding: "utf8",
      env: process.env,
    });
}

try {
  if (modo === "worker") worker();
  else if (!noRag && modo === "prompt") await prompt();
  else if (!noRag && modo === "subagent-stop") capturar("agent");
  else if (!noRag && modo === "session-end") capturar("sessao");
} catch {
  // falha aberta: sem memória, mas sem travar
}
process.exitCode = 0;
