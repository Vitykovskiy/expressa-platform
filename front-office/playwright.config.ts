import { defineConfig, devices } from "@playwright/test";

import {
  frontOfficeAppOrigin,
  frontOfficeAppWebServerCommand,
  frontOfficeAuthBackendCommand,
  frontOfficeBackendGracefulShutdown,
  frontOfficeBackendReadyUrl,
  frontOfficeMobileViewport,
  frontOfficePlaywrightOutputDirectory,
  frontOfficePlaywrightSnapshotPathTemplate,
  frontOfficePlaywrightTarget,
  frontOfficePlaywrightTestDirectory,
  frontOfficePlaywrightTestMatch,
  frontOfficeScreenshotOptions,
  frontOfficeStorybookOrigin,
  frontOfficeStorybookTestMatches,
  frontOfficeStorybookWebServerCommand,
} from "./playwright.config.constants";

const target = process.env.PLAYWRIGHT_TARGET ?? frontOfficePlaywrightTarget.app;
const storybook = target !== frontOfficePlaywrightTarget.app;
const storybookTestMatch =
  target === frontOfficePlaywrightTarget.a11y
    ? frontOfficeStorybookTestMatches.a11y
    : frontOfficeStorybookTestMatches.visual;

export default defineConfig({
  expect: {
    toHaveScreenshot: {
      ...frontOfficeScreenshotOptions,
    },
  },
  fullyParallel: false,
  workers: 1,
  snapshotPathTemplate: frontOfficePlaywrightSnapshotPathTemplate,
  outputDir: frontOfficePlaywrightOutputDirectory,
  testDir: frontOfficePlaywrightTestDirectory.root,
  testMatch: storybook ? storybookTestMatch : frontOfficePlaywrightTestMatch,
  use: {
    ...devices["Desktop Chrome"],
    baseURL: storybook ? frontOfficeStorybookOrigin : frontOfficeAppOrigin,
    viewport: frontOfficeMobileViewport,
  },
  webServer: storybook
    ? {
        command: frontOfficeStorybookWebServerCommand,
        reuseExistingServer: !process.env.CI,
        url: frontOfficeStorybookOrigin,
      }
    : [
        {
          command: frontOfficeAuthBackendCommand,
          gracefulShutdown: frontOfficeBackendGracefulShutdown,
          reuseExistingServer: false,
          url: frontOfficeBackendReadyUrl,
        },
        {
          command: frontOfficeAppWebServerCommand,
          reuseExistingServer: false,
          url: frontOfficeAppOrigin,
        },
      ],
});
