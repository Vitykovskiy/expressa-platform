import js from "@eslint/js";
import tseslint from "typescript-eslint";
import vue from "eslint-plugin-vue";
import stylistic from "@stylistic/eslint-plugin";
import prettier from "eslint-config-prettier";
import { STATEMENT_PADDING } from "./eslint.config.constants.mjs";

export default tseslint.config(
  { ignores: ["dist/**", "node_modules/**"] },
  js.configs.recommended,
  tseslint.configs.recommended,
  vue.configs["flat/recommended"],
  {
    files: ["**/*.vue"],
    languageOptions: { parserOptions: { parser: tseslint.parser } },
    rules: {
      "vue/block-order": ["error", { order: ["template", "script", "style"] }],
    },
  },
  {
    plugins: { "@stylistic": stylistic },
    rules: {
      "@stylistic/padding-line-between-statements": STATEMENT_PADDING,
      "@stylistic/no-multiple-empty-lines": [
        "error",
        { max: 1, maxBOF: 0, maxEOF: 0 },
      ],
      curly: ["error", "all"],
      "@typescript-eslint/consistent-type-imports": "error",
      "@typescript-eslint/no-non-null-assertion": "error",
    },
  },
  prettier,
);
