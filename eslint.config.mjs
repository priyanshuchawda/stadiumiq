import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import prettier from "eslint-config-prettier";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  prettier,
  {
    rules: {
      "max-lines": ["error", { max: 250, skipBlankLines: true, skipComments: true }],
      "max-lines-per-function": [
        "error",
        { max: 50, skipBlankLines: true, skipComments: true },
      ],
      complexity: ["error", 10],
      "max-depth": ["error", 4],
      "max-params": ["error", 4],
      "@typescript-eslint/no-explicit-any": "error",
      "import/no-cycle": "error",
    },
  },
  {
    // Type-aware rules on application code: catch unawaited promises and
    // promise misuse that plain syntax linting cannot see.
    files: ["src/**/*.ts", "src/**/*.tsx"],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      "@typescript-eslint/no-floating-promises": "error",
      "@typescript-eslint/await-thenable": "error",
      "@typescript-eslint/no-misused-promises": "error",
    },
  },
  {
    // Test files legitimately contain long describe/it suites and fixtures.
    files: ["tests/**", "**/*.test.ts", "**/*.test.tsx"],
    rules: {
      "max-lines-per-function": "off",
      "max-lines": "off",
    },
  },
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "coverage/**",
    "smart-crowd-navigator/**",
  ]),
]);

export default eslintConfig;
