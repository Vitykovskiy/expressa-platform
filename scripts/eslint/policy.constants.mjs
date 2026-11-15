export const STATEMENT_PADDING = [
  "error",
  { blankLine: "always", prev: "import", next: "*" },
  { blankLine: "any", prev: "import", next: "import" },
  { blankLine: "always", prev: ["const", "let"], next: "*" },
  { blankLine: "any", prev: ["const", "let"], next: ["const", "let"] },
  { blankLine: "always", prev: "function", next: "*" },
  { blankLine: "always", prev: "*", next: "function" },
  { blankLine: "always", prev: "block-like", next: "*" },
  { blankLine: "always", prev: "*", next: "return" },
];

export const COMMON_RULES = {
  curly: ["error", "all"],
  "@stylistic/brace-style": ["error", "1tbs", { allowSingleLine: false }],
  "no-nested-ternary": "error",
  "no-var": "error",
  "prefer-const": "error",
  "max-depth": ["warn", 3],
  "max-nested-callbacks": ["warn", 3],
  "@typescript-eslint/no-empty-function": [
    "error",
    {
      allow: ["constructors", "protected-constructors", "private-constructors"],
    },
  ],
  "@typescript-eslint/no-inferrable-types": "error",
  "@typescript-eslint/no-unnecessary-type-constraint": "error",
  "@typescript-eslint/ban-ts-comment": [
    "error",
    {
      "ts-ignore": true,
      "ts-nocheck": true,
      "ts-expect-error": "allow-with-description",
      "ts-check": false,
    },
  ],
  "@stylistic/padding-line-between-statements": STATEMENT_PADDING,
  "@stylistic/no-multiple-empty-lines": [
    "error",
    { max: 1, maxBOF: 0, maxEOF: 0 },
  ],
};

export const TYPED_RULES = {
  "@typescript-eslint/no-floating-promises": "error",
  "@typescript-eslint/no-misused-promises": "error",
  "@typescript-eslint/no-unsafe-assignment": "error",
  "@typescript-eslint/no-unsafe-argument": "error",
  "@typescript-eslint/no-unsafe-return": "error",
  "@typescript-eslint/no-unsafe-call": "error",
  "@typescript-eslint/no-unsafe-member-access": "error",
  "@typescript-eslint/no-duplicate-type-constituents": "error",
  "@typescript-eslint/no-redundant-type-constituents": "error",
  "@typescript-eslint/switch-exhaustiveness-check": "error",
  "@typescript-eslint/prefer-readonly": "error",
  "@typescript-eslint/consistent-type-imports": "error",
};

export const VUE_RULES = {
  "vue/block-order": ["error", { order: ["template", "script", "style"] }],
  "vue/component-api-style": ["error", ["script-setup"]],
  "vue/block-lang": ["error", { script: { lang: "ts" } }],
  "vue/define-props-declaration": ["error", "type-based"],
  "vue/define-emits-declaration": ["error", "type-based"],
  "vue/no-mutating-props": "error",
  "vue/no-side-effects-in-computed-properties": "error",
  "vue/no-watch-after-await": "error",
  "vue/no-lifecycle-after-await": "error",
};

export const VUE_COMPONENT_UNSAFE_WARNINGS = {
  "@typescript-eslint/no-unsafe-argument": "warn",
  "@typescript-eslint/no-unsafe-assignment": "warn",
  "@typescript-eslint/no-unsafe-return": "warn",
  "@typescript-eslint/no-unsafe-call": "warn",
  "@typescript-eslint/no-unsafe-member-access": "warn",
};

export const FRONT_LAYERS = [
  "app",
  "pages",
  "widgets",
  "features",
  "entities",
  "shared",
];

export const CONTOURS = ["backend", "front-office", "back-office"];

export const IO_MODULES = [
  "fs",
  "http",
  "https",
  "http2",
  "net",
  "tls",
  "dns",
  "dgram",
  "child_process",
  "cluster",
  "worker_threads",
  "readline",
];
