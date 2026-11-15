import eslint from "@eslint/js";
import prettier from "eslint-config-prettier/flat";
import stylistic from "@stylistic/eslint-plugin";
import vue from "eslint-plugin-vue";
import globals from "globals";
import tseslint from "typescript-eslint";
import expressa from "../scripts/eslint/index.mjs";
import {
  COMMON_RULES,
  TYPED_RULES,
  VUE_COMPONENT_UNSAFE_WARNINGS,
  VUE_RULES,
} from "../scripts/eslint/policy.constants.mjs";

export default tseslint.config(
  { ignores: ["coverage", "dist", "node_modules"] },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  ...vue.configs["flat/recommended"],
  prettier,
  {
    plugins: { "@stylistic": stylistic, expressa },
    rules: COMMON_RULES,
  },
  {
    files: ["**/*.{ts,vue,mjs}"],
    rules: {
      "expressa/layer-imports": ["error", { contour: "front-office" }],
    },
  },
  {
    files: ["**/*.{ts,vue}"],
    languageOptions: {
      globals: globals.browser,
      parserOptions: { extraFileExtensions: [".vue"], parser: tseslint.parser },
    },
  },
  {
    files: ["src/**/*.{ts,vue}"],
    ignores: ["**/*.spec.ts", "**/*.test.ts"],
    languageOptions: {
      parserOptions: {
        project: "./tsconfig.app.json",
        tsconfigRootDir: import.meta.dirname,
        extraFileExtensions: [".vue"],
        parser: tseslint.parser,
      },
    },
    rules: { ...TYPED_RULES, "expressa/declaration-placement": "error" },
  },
  {
    files: ["src/**/*.vue"],
    rules: VUE_COMPONENT_UNSAFE_WARNINGS,
  },
  {
    files: ["src/main.ts"],
    rules: { "@typescript-eslint/no-unsafe-argument": "warn" },
  },
  {
    files: ["src/app/router.ts"],
    rules: { "@typescript-eslint/no-unsafe-assignment": "warn" },
  },
  { files: ["**/*.vue"], rules: VUE_RULES },
  {
    files: ["**/*.mjs"],
    languageOptions: { globals: { ...globals.browser, ...globals.node } },
  },
);
