import { createBrowserClient } from "@supabase/ssr";

/** Cliente do navegador: usa só a chave pública (NEXT_PUBLIC_*). */
export function criarClienteNavegador() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL as string,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string,
  );
}
