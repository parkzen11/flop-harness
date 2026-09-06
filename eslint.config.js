// @ts-check
import js from "@eslint/js";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["dist/**", "coverage/**", "node_modules/**", "vendor/**", "units/**"] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["**/*.ts"],
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_", caughtErrors: "all" },
      ],
      "@typescript-eslint/consistent-type-imports": "error",
      "no-console": "off",
      "max-len": [
        "error",
        { code: 120, ignoreStrings: true, ignoreUrls: true, ignoreTemplateLiterals: true },
      ],
      "max-lines-per-function": ["warn", { max: 60, skipBlankLines: true, skipComments: true }],
    },
  },
  {
    files: ["test/**/*.ts"],
    rules: { "max-lines-per-function": "off" },
  },
);
