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
