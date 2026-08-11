import { defineConfig, devices } from "@playwright/test";

import {
  frontOfficeAppOrigin,
  frontOfficeAppWebServerCommand,
  frontOfficeAuthBackendCommand,
  frontOfficeBackendGracefulShutdown,
  frontOfficeBackendReadyUrl,
  frontOfficeMobileViewport,
  frontOfficePlaywrightOutputDirectory,
  frontOfficePlaywrightTestDirectory,
  frontOfficePlaywrightTestMatch,
} from "./playwright.config.constants";

export default defineConfig({
  fullyParallel: false,
  workers: 1,
  outputDir: frontOfficePlaywrightOutputDirectory,
  testDir: frontOfficePlaywrightTestDirectory.root,
  testMatch: frontOfficePlaywrightTestMatch,
  use: {
    ...devices["Desktop Chrome"],
    baseURL: frontOfficeAppOrigin,
    viewport: frontOfficeMobileViewport,
  },
  webServer: [
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
