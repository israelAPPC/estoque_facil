// Utilitários compartilhados pelos hooks. exit 2 = bloqueia; exit 0 = permite.
import { readFileSync } from "node:fs";
import path from "node:path";

export function lerEntrada() {
  try {
    return JSON.parse(readFileSync(0, "utf8") || "{}");
  } catch {
    return {};
  }
}

export function bloquear(mensagem) {
  process.stderr.write(`BLOQUEADO: ${mensagem}\n`);
  process.exit(2);
}

export const raiz = () => process.env.CLAUDE_PROJECT_DIR || process.cwd();

export function relativo(caminho) {
  return path
    .relative(raiz(), path.resolve(raiz(), caminho))
    .replaceAll("\\", "/");
}

// Comandos que nenhum agent de implementação pode rodar (decisão do usuário).
export const COMANDOS_PROIBIDOS = [
  [
    /\bgit\s+(push|commit|reset|clean|rebase|merge|tag|checkout\s+--|stash\s+(drop|clear))\b/i,
    "git push/commit/reset/clean e similares são feitos só pelo usuário",
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
    /(curl|wget|iwr|Invoke-WebRequest)[^\n|]*\|\s*(sh|bash|iex|node)\b|\|\s*iex\b/i,
    "baixar e executar script remoto não é permitido",
  ],
  [
    /\.env(?!\.example)(\.[a-z]+)?(\s|$|"|')/i,
    "arquivos .env guardam segredos e não podem ser lidos nem alterados por comando",
  ],
  [
    /\bnpm\s+(i|install|add)\s+[^-\s]/i,
    "instalar dependência exige decisão do usuário (regra dos 14 dias); registre em PENDENCIAS.md e peça",
  ],
];

export function comandoProibido(comando) {
  for (const [regex, motivo] of COMANDOS_PROIBIDOS) {
    if (regex.test(comando)) return motivo;
  }
  return null;
}

// Arquivos que nenhum agent de implementação pode editar.
export const ARQUIVOS_PROTEGIDOS = [
  [
    /^(SPEC|PLAN|CLAUDE|AGENTS)\.md$/,
    "SPEC, PLAN e CLAUDE.md só mudam com decisão do usuário; sugira a mudança na resposta",
  ],
  [
    /^\.env(\.(?!example$).+)?$|\/\.env(\.(?!example$).+)?$/,
    "arquivos .env guardam segredos",
  ],
  [
    /^\.claude\//,
    "configuração do Claude (agents, skills, hooks, settings) não é editada por agents",
  ],
  [/^\.(opencode|gemini)\//, "configuração de agents não é editada por agents"],
  [
    /^package(-lock)?\.json$/,
    "mudar dependências ou scripts exige decisão do usuário; registre em PENDENCIAS.md",
  ],
];

// Comandos de verificação permitidos para agents de QA/revisão e para o orquestrador.
export const COMANDOS_DE_TESTE = [
  /^npm\s+(run\s+)?test(\s+--?[\w=./:-]+|\s+[\w./-]+)*$/,
  /^npm\s+run\s+(lint|typecheck)$/,
  /^npx\s+vitest(\s+run)?(\s+--?[\w=./:-]+|\s+[\w./-]+)*$/,
  /^npx\s+biome\s+(check|lint)(\s+--?[\w=./:-]+|\s+[\w./-]+)*$/,
  /^npx\s+tsc\s+--noEmit$/,
];
// Impede "npm test && rm ..." e redirecionamentos.
export const ENCADEAMENTO = /[;&|><`]|\$\(/;
