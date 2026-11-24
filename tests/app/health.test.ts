import { describe, expect, it } from "vitest";
import { GET } from "@/app/health/route";

describe("GET /health", () => {
  it("responde 200 com status ok", async () => {
    const resposta = GET();
    expect(resposta.status).toBe(200);
    expect(await resposta.json()).toEqual({ status: "ok" });
  });
});
