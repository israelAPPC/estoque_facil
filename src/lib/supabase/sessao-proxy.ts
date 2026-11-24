import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import { validarEnv } from "@/lib/env";
import { decidirAcesso } from "@/modules/autenticacao/acesso";

/** Renova o cookie de sessão e aplica a proteção de rotas. */
export async function atualizarSessao(request: NextRequest) {
  const env = validarEnv();
  let resposta = NextResponse.next({ request });
  const supabase = createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (lista) => {
          for (const { name, value } of lista) request.cookies.set(name, value);
          resposta = NextResponse.next({ request });
          for (const { name, value, options } of lista) {
            resposta.cookies.set(name, value, options);
          }
        },
      },
    },
  );
  const { data } = await supabase.auth.getUser();
  const decisao = decidirAcesso(request.nextUrl.pathname, Boolean(data.user));
  if (decisao === "permitir") return resposta;

  const destino = request.nextUrl.clone();
  destino.pathname = decisao === "redirecionar-login" ? "/login" : "/";
  destino.search = "";
  const redirecionamento = NextResponse.redirect(destino);
  for (const c of resposta.cookies.getAll()) redirecionamento.cookies.set(c);
  return redirecionamento;
}
