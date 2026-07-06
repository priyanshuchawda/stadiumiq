import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    projects: [
      {
        extends: true,
        test: {
          name: "unit",
          environment: "node",
          include: ["src/**/*.test.ts", "tests/unit/**/*.test.ts"],
          exclude: ["tests/e2e/**", "tests/live/**"],
        },
      },
      {
        extends: true,
        test: {
          name: "component",
          environment: "jsdom",
          setupFiles: ["./tests/setup.ts"],
          include: ["src/**/*.test.tsx", "tests/component/**/*.test.tsx"],
          exclude: ["tests/e2e/**", "tests/live/**"],
        },
      },
      {
        extends: true,
        test: {
          name: "live",
          environment: "node",
          setupFiles: ["./tests/live/setup.ts"],
          include: ["tests/live/**/*.test.ts"],
        },
      },
    ],
    coverage: {
      provider: "v8",
      include: ["src/server/services/**", "src/lib/ai/**"],
      thresholds: {
        lines: 80,
        branches: 80,
        functions: 80,
        statements: 80,
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "server-only": path.resolve(__dirname, "./tests/mocks/server-only.ts"),
    },
  },
});
