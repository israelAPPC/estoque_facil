// Assistente Gemini para tarefas simples (análise, sugestão de testes, segunda opinião, resumo).
// Somente consulta: não grava nada no projeto e não executa nada. A resposta é OPINIÃO a conferir.
// Uso:
//   node scripts/gemini-assist.mjs <analise|testes|revisao|resumo> [--arquivos a.ts,b.ts] [--dry-run] "pergunta"
//   node scripts/gemini-assist.mjs --modelos        (lista modelos disponíveis para a sua chave)
// A chave GEMINI_API_KEY fica só em .env.local (ou no ambiente): nunca no código, em log ou em argumento.
// O conteúdo enviado SAI da sua máquina para o Google: só arquivos citados, sem segredos (redigidos) e sem .env.
import { existsSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

const RAIZ = process.env.CLAUDE_PROJECT_DIR || process.cwd();
const LIMITE_BYTES = 60 * 1024;
const TEMPO_MAX_MS = 60_000;
const MODELO_PADRAO = "gemini-flash-latest";

const TAREFAS = {
  analise:
    "Você analisa código TypeScript/Next.js/Supabase de um sistema de estoque. Aponte problemas prováveis, riscos e pontos pouco claros, com arquivo e trecho. Seja objetivo, em português, em tópicos curtos.",
  testes:
    "Você sugere casos de teste (Vitest) para o código recebido: caso feliz, bordas e erros. Liste os casos como 'dado/quando/então'; não escreva o código completo. Responda em português.",
  revisao:
    "Você dá uma segunda opinião de revisão de código (corretude, segurança, legibilidade). Classifique cada achado como BLOQUEANTE, IMPORTANTE ou SUGESTÃO, com o trecho. Responda em português.",
  resumo:
    "Você resume o material recebido em português claro, em até 10 linhas, destacando decisões, riscos e pendências.",
};

// Nunca enviar: segredos, banco local, dependências.
const PROIBIDOS = [
  /(^|\/)\.env(\.|$)/i,
  /\.(pem|key|p12|pfx)$/i,
  /(^|\/)rag\.db/i,
  /(^|\/)node_modules\//,
  /(^|\/)\.next\//,
  /(^|\/)\.git\//,
  /(^|\/)supabase\/\.temp\//,
];

function redigir(texto) {
  return texto
    .replace(/\beyJ[\w-]{10,}\.[\w-]{10,}\.[\w-]{10,}/g, "[JWT]")
    .replace(/\b(sk|sb|pk|ghp|gho|xox[bap]|AIza)[-_]?[\w-]{16,}/gi, "[CHAVE]")
    .replace(
      /\b([A-Z][A-Z0-9_]*(KEY|SECRET|TOKEN|PASSWORD|SENHA)[A-Z0-9_]*)\s*[=:]\s*\S+/g,
      "$1=[REMOVIDO]",
    )
    .replace(/[\w.+-]+@[\w-]+\.[\w.-]+/g, "[EMAIL]");
}

function falhar(msg) {
  console.error(`gemini-assist: ${msg}`);
  process.exit(1);
}

function carregarChave() {
  if (
    !process.env.GEMINI_API_KEY &&
    existsSync(path.join(RAIZ, ".env.local"))
  ) {
    try {
      process.loadEnvFile(path.join(RAIZ, ".env.local"));
    } catch {
      // arquivo ilegível: segue sem chave
    }
  }
  return process.env.GEMINI_API_KEY;
}

async function chamar(chave, modelo, caminho, corpo) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TEMPO_MAX_MS);
  try {
    const resp = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/${caminho}`,
      {
        method: corpo ? "POST" : "GET",
        headers: {
          "x-goog-api-key": chave,
          "content-type": "application/json",
        },
        body: corpo ? JSON.stringify(corpo) : undefined,
        signal: ctrl.signal,
      },
    );
    if (!resp.ok) {
      // não repete o corpo da resposta (pode conter eco da requisição): só o status
      falhar(
        `a API respondeu HTTP ${resp.status}${resp.status === 400 || resp.status === 403 ? " (confira a chave e o modelo " + modelo + ")" : ""}.`,
      );
    }
    return await resp.json();
  } catch (e) {
    falhar(
      e instanceof Error && e.name === "AbortError"
        ? "tempo esgotado (60 s)."
        : "falha de rede ao chamar a API.",
    );
  } finally {
    clearTimeout(timer);
  }
}

const args = process.argv.slice(2);
const flag = (n) => args.includes(`--${n}`);
const valor = (n) => {
  const i = args.indexOf(`--${n}`);
  return i >= 0 ? args[i + 1] : undefined;
};
const modelo = process.env.GEMINI_MODEL || MODELO_PADRAO;

if (flag("modelos")) {
  const chave = carregarChave();
  if (!chave) falhar("GEMINI_API_KEY não encontrada (coloque em .env.local).");
  const r = await chamar(chave, modelo, "models?pageSize=100", null);
  for (const m of r.models ?? [])
    if ((m.supportedGenerationMethods ?? []).includes("generateContent"))
      console.log(m.name.replace("models/", ""));
  process.exit(0);
}

const tarefa = args.find((a) => TAREFAS[a]);
const pergunta = args
  .filter(
    (a, i) =>
      !a.startsWith("--") && a !== tarefa && args[i - 1] !== "--arquivos",
  )
  .join(" ")
  .trim();
if (!tarefa) falhar(`informe a tarefa: ${Object.keys(TAREFAS).join(" | ")}.`);

// Monta o conteúdo: só os arquivos pedidos, dentro do projeto, sem segredos.
let anexos = "";
for (const nome of (valor("arquivos") ?? "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean)) {
  const abs = path.resolve(RAIZ, nome);
  const rel = path.relative(RAIZ, abs).replaceAll("\\", "/");
  if (rel.startsWith("..")) falhar(`${nome} está fora do projeto.`);
  if (PROIBIDOS.some((r) => r.test(rel)))
    falhar(
      `${rel} não pode ser enviado (segredo, banco local ou dependência).`,
    );
  if (!existsSync(abs) || !statSync(abs).isFile()) falhar(`${rel} não existe.`);
  anexos += `\n\n=== ${rel} ===\n${redigir(readFileSync(abs, "utf8"))}`;
}
if (!anexos && !pergunta) falhar("informe uma pergunta ou --arquivos.");
const texto = `${pergunta}${anexos}`;
if (Buffer.byteLength(texto) > LIMITE_BYTES)
  falhar(`conteúdo acima de ${LIMITE_BYTES / 1024} KB; envie menos arquivos.`);

if (flag("dry-run")) {
  console.log(
    `[dry-run] tarefa=${tarefa} modelo=${modelo} bytes=${Buffer.byteLength(texto)}\n--- conteúdo que seria enviado ---\n${texto}`,
  );
  process.exit(0);
}

const chave = carregarChave();
if (!chave)
  falhar(
    "GEMINI_API_KEY não encontrada. Coloque a chave em .env.local (arquivo ignorado pelo Git) e rode de novo.",
  );

const r = await chamar(chave, modelo, `models/${modelo}:generateContent`, {
  systemInstruction: { parts: [{ text: TAREFAS[tarefa] }] },
  contents: [{ role: "user", parts: [{ text: texto }] }],
  generationConfig: { temperature: 0.2, maxOutputTokens: 2048 },
});
const saida = (r.candidates?.[0]?.content?.parts ?? [])
  .map((p) => p.text ?? "")
  .join("")
  .trim();
if (!saida)
  falhar(
    `resposta vazia${r.promptFeedback?.blockReason ? ` (bloqueada: ${r.promptFeedback.blockReason})` : ""}.`,
  );
console.log(
  `[Gemini ${modelo}: opinião a conferir, não é decisão]\n${redigir(saida)}`,
);
