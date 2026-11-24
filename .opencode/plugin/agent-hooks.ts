// Hooks do EstoqueFácil para o OpenCode.
// Limitação: o OpenCode não informa qual agent chamou a ferramenta, então estas
// são as regras que valem para TODOS os agents (as mesmas proteções globais dos
// hooks do Claude Code). Escopo por pasta e "somente leitura" ficam no bloco
// `tools` do frontmatter de cada agent em .opencode/agents/.
import type { Plugin } from "@opencode-ai/plugin";

const COMANDOS_PROIBIDOS: [RegExp, string][] = [
  [
    /\bgit\s+(push|commit|reset|clean|rebase|merge|tag|checkout\s+--|stash\s+(drop|clear))\b/i,
    "git push/commit/reset/clean são feitos só pelo usuário",
  ],
  [
    /\brm\s+-[a-z]*[rf]|\brmdir\s+\/s|\bdel\s+\/[sq]|Remove-Item[^\n]*-Recurse/i,
    "apagar arquivos em massa não é permitido",
  ],
  [
    /\b(vercel|netlify)\b|\bnpm\s+publish\b/i,
    "deploy e publicação são feitos só pelo usuário",
  ],
  [
    /\bsupabase\s+(db\s+(push|reset)|projects|link)\b/i,
    "comandos do Supabase que alteram o projeto remoto são feitos só pelo usuário",
  ],
  [
    /(curl|wget)[^\n|]*\|\s*(sh|bash|node)\b/i,
    "baixar e executar script remoto não é permitido",
  ],
  [
    /\.env(?!\.example)(\.[a-z]+)?(\s|$|"|')/i,
    "arquivos .env guardam segredos",
  ],
  [
    /\bnpm\s+(i|install|add)\s+[^-\s]/i,
    "instalar dependência exige decisão do usuário",
  ],
];

const ARQUIVOS_PROTEGIDOS: [RegExp, string][] = [
  [/(^|\/)(SPEC|PLAN|CLAUDE|AGENTS)\.md$/, "só mudam com decisão do usuário"],
  [/(^|\/)\.env(\.(?!example$).+)?$/, "arquivos .env guardam segredos"],
  [
    /(^|\/)\.(claude|opencode|gemini)\//,
    "configuração de agents não é editada por agents",
  ],
  [
    /(^|\/)package(-lock)?\.json$/,
    "mudar dependências exige decisão do usuário",
  ],
];

const EDICAO = new Set(["write", "edit", "patch"]);

export const AgentHooks: Plugin = async ({ $ }) => {
  return {
    "tool.execute.before": async (input, output) => {
      const args = output.args ?? {};
      if (input.tool === "bash") {
        const comando = String(args.command ?? "");
        for (const [regex, motivo] of COMANDOS_PROIBIDOS) {
          if (regex.test(comando)) throw new Error(`BLOQUEADO: ${motivo}.`);
        }
      }
      if (EDICAO.has(input.tool)) {
        const alvo = String(args.filePath ?? args.file_path ?? "").replaceAll(
          "\\",
          "/",
        );
        for (const [regex, motivo] of ARQUIVOS_PROTEGIDOS) {
          if (regex.test(alvo))
            throw new Error(
              `BLOQUEADO: não é permitido editar ${alvo}: ${motivo}.`,
            );
        }
      }
    },
    // Depois de editar código em src/, roda os testes e devolve a falha ao agent.
    "tool.execute.after": async (input, output) => {
      if (!EDICAO.has(input.tool)) return;
      const alvo = String(
        output.args?.filePath ?? output.args?.file_path ?? "",
      ).replaceAll("\\", "/");
      if (!/(^|\/)src\//.test(alvo)) return;
      const r = await $`npx vitest run`.nothrow().quiet();
      if (
        r.exitCode !== 0 &&
        !/No test files found/i.test(r.stdout.toString())
      ) {
        output.output += `\n\nOs testes estão falhando. Corrija antes de continuar:\n${r.stdout.toString().split("\n").slice(-25).join("\n")}`;
      }
    },
  };
};
