import { existsSync } from "node:fs";
import { loadEnvFile } from "node:process";

import { defineConfig } from "@playwright/test";

import { getE2eEnvironment } from "@support/config/e2e-environment";

const LOCAL_ENV_PATH = ".env.e2e.local";

if (existsSync(LOCAL_ENV_PATH)) {
  loadEnvFile(LOCAL_ENV_PATH);
}

getE2eEnvironment();

export default defineConfig({
  testDir: ".",
  testMatch: ["specs/**/*.spec.ts", "support/config/**/*.test.ts"],
  workers: 1,
  retries: 0,
  reporter: [["list"], ["html"]],
  use: {
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { browserName: "chromium" },
    },
  ],
});
