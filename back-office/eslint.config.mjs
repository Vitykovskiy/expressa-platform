import js from "@eslint/js";
import tseslint from "typescript-eslint";
import vue from "eslint-plugin-vue";
import stylistic from "@stylistic/eslint-plugin";
import prettier from "eslint-config-prettier";
import expressa from "../scripts/eslint/index.mjs";
import {
  COMMON_RULES,
  TYPED_RULES,
  VUE_COMPONENT_UNSAFE_WARNINGS,
  VUE_RULES,
} from "../scripts/eslint/policy.constants.mjs";

export default tseslint.config(
  { ignores: ["dist/**", "node_modules/**"] },
  js.configs.recommended,
  tseslint.configs.recommended,
  vue.configs["flat/recommended"],
  prettier,
  {
    plugins: { "@stylistic": stylistic, expressa },
    rules: {
      ...COMMON_RULES,
      "@typescript-eslint/consistent-type-imports": "error",
      "@typescript-eslint/no-non-null-assertion": "error",
    },
  },
  {
    files: ["**/*.{ts,vue,mjs}"],
    rules: { "expressa/layer-imports": ["error", { contour: "back-office" }] },
  },
  {
    files: ["**/*.vue"],
    languageOptions: {
      parserOptions: { parser: tseslint.parser, extraFileExtensions: [".vue"] },
    },
    rules: VUE_RULES,
  },
  {
    files: ["src/**/*.{ts,vue}"],
    ignores: ["**/*.spec.ts", "**/*.test.ts"],
    languageOptions: {
      parserOptions: {
        project: "./tsconfig.json",
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
    files: ["src/app/bootstrap.ts"],
    rules: { "@typescript-eslint/no-unsafe-argument": "warn" },
  },
  {
    files: ["src/app/router.ts"],
    rules: { "@typescript-eslint/no-unsafe-assignment": "warn" },
  },
);
