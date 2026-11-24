// Adaptador: hook PreToolUse do Antigravity -> proteções globais do projeto (mesmas do Claude Code).
// Entrada (stdin): { toolCall: { name, args } }. Saída (stdout): { decision: "allow" | "deny", reason }.
// Reaproveita .claude/hooks/_lib.mjs (comandos proibidos e arquivos protegidos). Falha aberta se a entrada for ilegível.
import { readFileSync } from "node:fs";
import path from "node:path";
import {
  ARQUIVOS_PROTEGIDOS,
  comandoProibido,
} from "../.claude/hooks/_lib.mjs";

const RAIZ = process.env.CLAUDE_PROJECT_DIR || process.cwd();
const responder = (decision, reason) => {
  process.stdout.write(
    JSON.stringify(reason ? { decision, reason } : { decision }),
  );
  process.exit(0);
};

let entrada = {};
try {
  entrada = JSON.parse(readFileSync(0, "utf8") || "{}");
} catch {
  responder("allow");
}
const nome = entrada.toolCall?.name ?? "";
const args = entrada.toolCall?.args ?? {};

if (nome === "run_command") {
  const motivo = comandoProibido(String(args.CommandLine ?? ""));
  if (motivo) responder("deny", `Comando bloqueado pelo projeto: ${motivo}.`);
} else if (/write_to_file|replace_file_content/.test(nome)) {
  const alvo = String(
    args.TargetFile ?? args.AbsolutePath ?? args.FilePath ?? "",
  );
  if (alvo) {
    const rel = path
      .relative(RAIZ, path.resolve(RAIZ, alvo))
      .replaceAll("\\", "/");
    for (const [regex, motivo] of ARQUIVOS_PROTEGIDOS) {
      if (regex.test(rel))
        responder("deny", `Arquivo protegido (${rel}): ${motivo}.`);
    }
  }
}
responder("allow");
