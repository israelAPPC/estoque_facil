import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { validarEnv } from "@/lib/env";

/** Cliente Supabase para componentes e ações de servidor (chave pública + cookies de sessão). */
export async function criarClienteServidor() {
  const env = validarEnv();
  const armazem = await cookies();
  return createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll: () => armazem.getAll(),
        setAll: (lista) => {
          try {
            for (const { name, value, options } of lista) {
              armazem.set(name, value, options);
            }
          } catch {
            // Chamado de componente de servidor: o proxy renova a sessão.
          }
        },
      },
    },
  );
}
