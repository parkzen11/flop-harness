import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["test/**/*.test.ts"],
    coverage: {
      provider: "v8",
      include: ["src/**/*.ts"],
      exclude: ["src/mcp/**", "src/hermes-plugin/**", "src/**/index.ts"],
      reporter: ["text", "json-summary", "lcov"],
      thresholds: { lines: 80 },
    },
  },
});
