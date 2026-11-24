import { spawnSync } from "node:child_process";
import path from "node:path";
import { describe, expect, it } from "vitest";

// Regressão do AGT-008: cwd com o disco em minúscula no Windows quebrava o Vitest
// com "Cannot read properties of undefined (reading 'config')".
describe.runIf(process.platform === "win32")(
  "Vitest com disco em minúscula",
  () => {
    it("roda os testes quando o cwd começa com letra de disco minúscula", () => {
      const raiz = process.cwd().replace(/^[A-Z]:/, (d) => d.toLowerCase());
      const env: NodeJS.ProcessEnv = { ...process.env };
      for (const chave of Object.keys(env)) {
        if (chave.startsWith("VITEST")) delete env[chave];
      }
      const r = spawnSync(
        process.execPath,
        [
          path.join(raiz, "node_modules", "vitest", "vitest.mjs"),
          "run",
          "tests/app",
        ],
        { cwd: raiz, env, encoding: "utf8", timeout: 60000 },
      );
      expect(`${r.stdout}${r.stderr}`).not.toMatch(/reading 'config'/);
      expect(r.status).toBe(0);
    }, 70000);
  },
);
