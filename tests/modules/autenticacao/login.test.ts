import { describe, expect, it, vi } from "vitest";
import {
  type ClienteAuth,
  entrar,
  MENSAGEM_LOGIN_INVALIDO,
} from "@/modules/autenticacao/login";

function cliente(erro: unknown): ClienteAuth {
  return { signInWithPassword: vi.fn().mockResolvedValue({ error: erro }) };
}

describe("entrar", () => {
  it("credenciais corretas criam sessão", async () => {
    const c = cliente(null);
    const r = await entrar(c, { email: "a@b.com", senha: "segredo123" });
    expect(r).toEqual({ ok: true });
    expect(c.signInWithPassword).toHaveBeenCalledWith({
      email: "a@b.com",
      password: "segredo123",
    });
  });
  it("senha errada devolve mensagem genérica, sem detalhe", async () => {
    const r = await entrar(cliente({ message: "Invalid login credentials" }), {
      email: "a@b.com",
      senha: "x",
    });
    expect(r).toEqual({ ok: false, mensagem: MENSAGEM_LOGIN_INVALIDO });
    expect(MENSAGEM_LOGIN_INVALIDO).not.toMatch(/invalid|e-mail não/i);
  });
  it("entrada inválida usa a mesma mensagem e não chama o Supabase", async () => {
    const c = cliente(null);
    const r = await entrar(c, { email: "nao-e-email", senha: "" });
    expect(r).toEqual({ ok: false, mensagem: MENSAGEM_LOGIN_INVALIDO });
    expect(c.signInWithPassword).not.toHaveBeenCalled();
  });
  it("erro inesperado também é genérico", async () => {
    const c: ClienteAuth = {
      signInWithPassword: vi.fn().mockRejectedValue(new Error("rede")),
    };
    const r = await entrar(c, { email: "a@b.com", senha: "x" });
    expect(r).toEqual({ ok: false, mensagem: MENSAGEM_LOGIN_INVALIDO });
  });
});
