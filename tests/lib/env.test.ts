import { describe, expect, it } from "vitest";
import { validarEnv } from "@/lib/env";

const valido = {
  NEXT_PUBLIC_SUPABASE_URL: "https://abc.supabase.co",
  NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon",
  SUPABASE_SERVICE_ROLE_KEY: "service",
} as unknown as NodeJS.ProcessEnv;

describe("validarEnv", () => {
  it("aceita variáveis válidas", () => {
    expect(validarEnv(valido).NEXT_PUBLIC_SUPABASE_URL).toBe(
      "https://abc.supabase.co",
    );
  });

  it("rejeita variável ausente citando só o nome, sem o valor", () => {
    const { SUPABASE_SERVICE_ROLE_KEY: _removida, ...resto } = valido;
    expect(() => validarEnv(resto as NodeJS.ProcessEnv)).toThrow(
      "SUPABASE_SERVICE_ROLE_KEY",
    );
  });
});
