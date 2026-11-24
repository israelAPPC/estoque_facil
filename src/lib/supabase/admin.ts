import { createClient } from "@supabase/supabase-js";
import { validarEnv } from "@/lib/env";

/** Cliente com chave de serviço: SOMENTE código de servidor, nunca importar em componente cliente. */
export function criarClienteAdmin() {
  const env = validarEnv();
  return createClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}
