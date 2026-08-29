import { existsSync } from "node:fs";
import { loadEnvFile } from "node:process";

import { defineConfig } from "@playwright/test";

import { getE2eEnvironment } from "@support/config/e2e-environment";

const LOCAL_ENV_PATH = ".env.e2e.local";
const isSafeReportMode = process.env["E2E_SAFE_REPORT"] === "1";
const e2eProfile = process.env["E2E_PROFILE"];

const profileTestMatches = {
  empty: [
    "specs/authentication/first-customer-login.spec.ts",
    "specs/menu/empty-public-menu.spec.ts",
    "specs/catalog/empty-catalog.spec.ts",
    "specs/availability/empty-availability.spec.ts",
    "specs/queue/empty-queue.spec.ts",
  ],
  seeded: [
    "specs/authentication/repeat-customer-login.spec.ts",
    "specs/authentication/invalid-phone.spec.ts",
    "specs/authentication/invalid-otp.spec.ts",
    "specs/authentication/otp-resend-cooldown.spec.ts",
    "specs/authentication/session-lifecycle.spec.ts",
    "specs/authentication/staff-login.spec.ts",
    "specs/authentication/customer-staff-denied.spec.ts",
    "specs/menu/published-menu.spec.ts",
    "specs/menu/category-product-navigation.spec.ts",
    "specs/menu/default-product-configuration.spec.ts",
    "specs/cart/add-item.spec.ts",
    "specs/cart/merge-identical-items.spec.ts",
    "specs/cart/separate-configurations.spec.ts",
    "specs/cart/quantity-and-total.spec.ts",
    "specs/cart/remove-and-clear.spec.ts",
    "specs/cart/persist-after-reload-and-login.spec.ts",
  ],
  mutating: [
    "specs/menu/intake-closed.spec.ts",
    "specs/menu/unavailable-product.spec.ts",
    "specs/menu/unpublished-product.spec.ts",
    "specs/cart/revalidate-availability.spec.ts",
    "specs/checkout/**/*.spec.ts",
    "specs/customer-orders/**/*.spec.ts",
    "specs/queue/**/*.spec.ts",
    "specs/availability/**/*.spec.ts",
    "specs/catalog/**/*.spec.ts",
    "specs/journeys/**/*.spec.ts",
  ],
} as const;

if (existsSync(LOCAL_ENV_PATH)) {
  loadEnvFile(LOCAL_ENV_PATH);
}

getE2eEnvironment();

function getTestMatch(): string[] {
  if (e2eProfile === undefined) {
    return ["specs/**/*.spec.ts", "support/config/**/*.test.ts"];
  }

  const testMatch =
    profileTestMatches[e2eProfile as keyof typeof profileTestMatches];
  if (testMatch === undefined) {
    throw new Error("E2E_PROFILE must be empty, seeded, or mutating.");
  }

  return [...testMatch];
}

function getTestIgnore(): string[] | undefined {
  return e2eProfile === "mutating" ? [...profileTestMatches.empty] : undefined;
}

export default defineConfig({
  testDir: ".",
  testMatch: getTestMatch(),
  testIgnore: getTestIgnore(),
  timeout: 5 * 60_000,
  expect: { timeout: 15_000 },
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
    actionTimeout: 15_000,
    navigationTimeout: 15_000,
    timezoneId: "UTC",
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
