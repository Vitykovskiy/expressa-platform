import { defineConfig, devices } from "@playwright/test";

import {
  ordersBackOfficeOrigin,
  ordersBackOfficeWebServerCommand,
  ordersBackendCommand,
  ordersBackendReadyUrl,
  ordersFrontendOrigin,
  ordersFrontendWebServerCommand,
  ordersPlaywrightOutputDirectory,
  ordersPlaywrightTestMatch,
  ordersWebServerTimeout,
} from "./tests/e2e/orders.e2e.constants";

export default defineConfig({
  fullyParallel: false,
  workers: 1,
  outputDir: ordersPlaywrightOutputDirectory,
  testDir: ".",
  testMatch: ordersPlaywrightTestMatch,
  use: {
    ...devices["Desktop Chrome"],
    baseURL: ordersFrontendOrigin,
    trace: "on-first-retry",
  },
  webServer: [
    {
      command: ordersBackendCommand,
      reuseExistingServer: false,
      timeout: ordersWebServerTimeout,
      url: ordersBackendReadyUrl,
    },
    {
      command: ordersFrontendWebServerCommand,
      reuseExistingServer: false,
      timeout: ordersWebServerTimeout,
      url: ordersFrontendOrigin,
    },
    {
      command: ordersBackOfficeWebServerCommand,
      reuseExistingServer: false,
      timeout: ordersWebServerTimeout,
      url: ordersBackOfficeOrigin,
    },
  ],
});
