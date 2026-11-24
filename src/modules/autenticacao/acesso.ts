export type DecisaoAcesso =
  | "permitir"
  | "redirecionar-login"
  | "redirecionar-inicio";

const ROTAS_PUBLICAS = ["/login", "/health"] as const;

function ehRotaPublica(caminho: string): boolean {
  return ROTAS_PUBLICAS.some(
    (r) => caminho === r || caminho.startsWith(`${r}/`),
  );
}

/** Regra pura de proteção de rotas: só /login e /health dispensam sessão. */
export function decidirAcesso(
  caminho: string,
  temSessao: boolean,
): DecisaoAcesso {
  if (caminho === "/login" && temSessao) return "redirecionar-inicio";
  if (ehRotaPublica(caminho) || temSessao) return "permitir";
  return "redirecionar-login";
}
