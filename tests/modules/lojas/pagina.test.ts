import { describe, expect, it } from "vitest";
import { interpretarPagina } from "@/modules/lojas/pagina";

describe("interpretarPagina", () => {
  it("aceita inteiro positivo", () => expect(interpretarPagina("3")).toBe(3));
  it.each([undefined, "", "0", "-2", "abc", "1.5", ["2", "3"]])(
    "usa 1 para %j",
    (v) => expect(interpretarPagina(v)).toBe(1),
  );
});
