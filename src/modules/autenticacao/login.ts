import { z } from "zod";

export const MENSAGEM_LOGIN_INVALIDO = "E-mail ou senha incorretos.";

export const esquemaLogin = z.object({
  email: z.string().trim().email().max(254),
  senha: z.string().min(1).max(256),
});

export type EntradaLogin = z.input<typeof esquemaLogin>;

export type ResultadoLogin = { ok: true } | { ok: false; mensagem: string };

/** Parte do cliente Supabase Auth usada aqui (facilita testar). */
export interface ClienteAuth {
  signInWithPassword(credenciais: {
    email: string;
    password: string;
  }): Promise<{ error: unknown }>;
}

/** Valida a entrada e faz o login; qualquer falha devolve a mesma mensagem genérica. */
export async function entrar(
  cliente: ClienteAuth,
  entrada: EntradaLogin,
): Promise<ResultadoLogin> {
  const dados = esquemaLogin.safeParse(entrada);
  if (!dados.success) return { ok: false, mensagem: MENSAGEM_LOGIN_INVALIDO };
  try {
    const { error } = await cliente.signInWithPassword({
      email: dados.data.email,
      password: dados.data.senha,
    });
    if (error) return { ok: false, mensagem: MENSAGEM_LOGIN_INVALIDO };
    return { ok: true };
  } catch {
    return { ok: false, mensagem: MENSAGEM_LOGIN_INVALIDO };
  }
}
