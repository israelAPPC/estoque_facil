import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      // AGT-008: no Windows o cwd pode vir com o disco em minúscula ("c:\..."), o CLI do
      // Vitest carrega de "c:/" e os testes importavam "C:/", criando 2 instâncias do módulo
      // ("reading 'config'"). Ancorar o import no mesmo caminho do cwd evita a duplicata.
      vitest: path.join(
        process.cwd(),
        "node_modules",
        "vitest",
        "dist",
        "index.js",
      ),
    },
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
  },
});
