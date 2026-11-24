import { defineConfig } from "vitest/config";

// Testes contra um projeto Supabase de TESTE (nunca produção).
// Variáveis exigidas no ambiente do shell (não lê .env):
// TEST_SUPABASE_URL, TEST_SUPABASE_ANON_KEY, TEST_SUPABASE_EMAIL, TEST_SUPABASE_PASSWORD
export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/supabase/**/*.dbtest.ts"],
    testTimeout: 20_000,
  },
});
