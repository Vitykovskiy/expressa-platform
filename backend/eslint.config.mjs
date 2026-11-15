import eslint from "@eslint/js";
import prettier from "eslint-config-prettier";
import stylistic from "@stylistic/eslint-plugin";
import globals from "globals";
import tseslint from "typescript-eslint";
import expressa from "../scripts/eslint/index.mjs";
import {
  COMMON_RULES,
  TYPED_RULES,
} from "../scripts/eslint/policy.constants.mjs";

export default tseslint.config(
  { ignores: ["dist/**", "coverage/**"] },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  prettier,
  {
    languageOptions: { globals: globals.node },
    plugins: { "@stylistic": stylistic, expressa },
    rules: COMMON_RULES,
  },
  {
    files: ["**/*.{ts,mjs}"],
    rules: {
      "expressa/layer-imports": ["error", { contour: "backend" }],
    },
  },
  {
    files: ["src/**/*.ts"],
    ignores: ["**/*.spec.ts", "**/*.test.ts"],
    languageOptions: {
      parserOptions: {
        project: "./tsconfig.json",
        tsconfigRootDir: import.meta.dirname,
        experimentalDecorators: true,
        emitDecoratorMetadata: true,
      },
    },
    rules: {
      ...TYPED_RULES,
      "expressa/declaration-placement": "error",
    },
  },
);
