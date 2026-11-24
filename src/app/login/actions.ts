"use server";

import { redirect } from "next/navigation";
import { criarClienteServidor } from "@/lib/supabase/servidor";
import { entrar } from "@/modules/autenticacao/login";
import { sair } from "@/modules/autenticacao/sessao";

export interface EstadoLogin {
  mensagem: string | null;
}

export async function entrarAction(
  _anterior: EstadoLogin,
  dados: FormData,
): Promise<EstadoLogin> {
  const supabase = await criarClienteServidor();
  const resultado = await entrar(supabase.auth, {
    email: String(dados.get("email") ?? ""),
    senha: String(dados.get("senha") ?? ""),
  });
  if (!resultado.ok) return { mensagem: resultado.mensagem };
  redirect("/");
}

export async function sairAction(): Promise<void> {
  await sair();
}
