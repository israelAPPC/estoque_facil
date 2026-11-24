import { redirect } from "next/navigation";
import { criarClienteServidor } from "@/lib/supabase/servidor";

export interface UsuarioAtual {
  id: string;
  email: string | null;
}

/** Usuário da sessão atual (validado no servidor Auth) ou null. */
export async function obterUsuario(): Promise<UsuarioAtual | null> {
  const supabase = await criarClienteServidor();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return null;
  return { id: data.user.id, email: data.user.email ?? null };
}

/** Encerra a sessão e volta para /login. */
export async function sair(): Promise<never> {
  const supabase = await criarClienteServidor();
  await supabase.auth.signOut();
  redirect("/login");
}
