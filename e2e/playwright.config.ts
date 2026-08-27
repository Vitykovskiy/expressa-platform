import { existsSync } from "node:fs";
import { loadEnvFile } from "node:process";

import { defineConfig } from "@playwright/test";

import { getE2eEnvironment } from "@support/config/e2e-environment";

const LOCAL_ENV_PATH = ".env.e2e.local";
const isSafeReportMode = process.env["E2E_SAFE_REPORT"] === "1";

if (existsSync(LOCAL_ENV_PATH)) {
  loadEnvFile(LOCAL_ENV_PATH);
}

getE2eEnvironment();

export default defineConfig({
  testDir: ".",
  testMatch: ["specs/**/*.spec.ts", "support/config/**/*.test.ts"],
  timeout: 5 * 60_000,
  workers: 1,
  retries: 0,
  reporter: [
    ["list"],
    [
      "html",
      {
        open: "never",
        outputFolder:
          process.env["PLAYWRIGHT_HTML_OUTPUT_DIR"] ?? "playwright-report",
      },
    ],
  ],
  use: {
    screenshot: isSafeReportMode ? "off" : "only-on-failure",
    trace: isSafeReportMode ? "off" : "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { browserName: "chromium" },
    },
  ],
});
