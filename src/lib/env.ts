import { z } from "zod";

const esquema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
});

export type Env = z.infer<typeof esquema>;

/** Valida as variáveis de ambiente; lança erro listando só os nomes inválidos. */
export function validarEnv(fonte: NodeJS.ProcessEnv = process.env): Env {
  const resultado = esquema.safeParse(fonte);
  if (!resultado.success) {
    const nomes = resultado.error.issues.map((i) => i.path.join("."));
    throw new Error(
      `Variáveis de ambiente inválidas ou ausentes: ${nomes.join(", ")}`,
    );
  }
  return resultado.data;
}
