import { describe, expect, it } from "vitest";
import { decidirAcesso } from "@/modules/autenticacao/acesso";

describe("decidirAcesso", () => {
  it("sem sessão em rota protegida manda para /login", () => {
    expect(decidirAcesso("/", false)).toBe("redirecionar-login");
    expect(decidirAcesso("/estoque", false)).toBe("redirecionar-login");
    expect(decidirAcesso("/api/qualquer", false)).toBe("redirecionar-login");
  });
  it("com sessão permite rota protegida", () => {
    expect(decidirAcesso("/estoque", true)).toBe("permitir");
  });
  it("/login e /health são públicos", () => {
    expect(decidirAcesso("/login", false)).toBe("permitir");
    expect(decidirAcesso("/health", false)).toBe("permitir");
  });
  it("não confunde prefixo parecido com rota pública", () => {
    expect(decidirAcesso("/login-falso", false)).toBe("redirecionar-login");
    expect(decidirAcesso("/healthz", false)).toBe("redirecionar-login");
  });
  it("logado em /login vai para a página inicial", () => {
    expect(decidirAcesso("/login", true)).toBe("redirecionar-inicio");
  });
});
