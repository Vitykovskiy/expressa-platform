import { defineConfig, devices } from "@playwright/test";
import {
  authFrontendUrl,
  authBackendCommand,
  authBackendReadyUrl,
  authServerEnvironment,
  backOfficeAppUrl,
  backOfficeAppWebServerCommand,
  backOfficeAuthWebServerCommand,
  backOfficeDesktopBrowserDeviceName,
  backOfficePlaywrightProjectName,
  backOfficePlaywrightSnapshotPathTemplate,
  backOfficePlaywrightTestDirectory,
  backOfficePlaywrightTestMatch,
  backOfficePlaywrightTrace,
  backOfficeStorybookUrl,
  backOfficeStorybookWebServerCommand,
  backOfficeWebServerTimeout,
  playwrightTargets,
} from "./playwright.config.constants";
import type { PlaywrightTarget } from "./playwright.config.types";

const target = process.env.PLAYWRIGHT_TARGET as PlaywrightTarget | undefined;
const storybookTarget = target === playwrightTargets.storybook;
const authTarget = target === playwrightTargets.auth;

export default defineConfig({
  workers: process.env.CI ? 2 : 4,
  testDir: backOfficePlaywrightTestDirectory,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  snapshotPathTemplate: backOfficePlaywrightSnapshotPathTemplate,
  use: {
    baseURL: storybookTarget
      ? backOfficeStorybookUrl
      : authTarget
        ? authFrontendUrl
        : backOfficeAppUrl,
    trace: backOfficePlaywrightTrace,
  },
  projects: [
    {
      name: backOfficePlaywrightProjectName.app,
      testMatch: backOfficePlaywrightTestMatch.app,
      use: { ...devices[backOfficeDesktopBrowserDeviceName] },
    },
    {
      name: backOfficePlaywrightProjectName.auth,
      testMatch: backOfficePlaywrightTestMatch.auth,
      use: { ...devices[backOfficeDesktopBrowserDeviceName] },
    },
    {
      name: backOfficePlaywrightProjectName.storybook,
      testMatch: backOfficePlaywrightTestMatch.storybook,
      use: { ...devices[backOfficeDesktopBrowserDeviceName] },
    },
    {
      name: backOfficePlaywrightProjectName.storybookA11y,
      testMatch: backOfficePlaywrightTestMatch.storybookA11y,
      use: { ...devices[backOfficeDesktopBrowserDeviceName] },
    },
    {
      name: backOfficePlaywrightProjectName.storybookVisual,
      testMatch: backOfficePlaywrightTestMatch.storybookVisual,
      use: { ...devices[backOfficeDesktopBrowserDeviceName] },
    },
  ],
  webServer: authTarget
    ? [
        {
          command: backOfficeAuthWebServerCommand,
          url: authFrontendUrl,
          reuseExistingServer: false,
          timeout: backOfficeWebServerTimeout,
        },
        {
          command: authBackendCommand,
          env: authServerEnvironment,
          url: authBackendReadyUrl,
          reuseExistingServer: false,
          timeout: backOfficeWebServerTimeout,
        },
      ]
    : {
        command: storybookTarget
          ? backOfficeStorybookWebServerCommand
          : backOfficeAppWebServerCommand,
        url: storybookTarget ? backOfficeStorybookUrl : backOfficeAppUrl,
        reuseExistingServer: !process.env.CI,
        timeout: backOfficeWebServerTimeout,
      },
});
