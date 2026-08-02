import { defineConfig, devices } from '@playwright/test'

const storybookTarget = process.env.PLAYWRIGHT_TARGET === 'storybook'

export default defineConfig({
  testDir: './tests/e2e',
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  snapshotPathTemplate: '{testDir}/{testFilePath}-snapshots/{arg}{ext}',
  use: {
    baseURL: storybookTarget ? 'http://127.0.0.1:6006' : 'http://127.0.0.1:4173',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'app-e2e',
      testMatch: /app\.e2e\.ts/,
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'storybook-e2e',
      testMatch: /navigation\.e2e\.ts/,
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'storybook-a11y',
      testMatch: /a11y\.e2e\.ts/,
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'storybook-visual',
      testMatch: /visual\.e2e\.ts/,
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: storybookTarget ? 'npm run storybook -- --ci --host 127.0.0.1' : 'npm run preview',
    url: storybookTarget ? 'http://127.0.0.1:6006' : 'http://127.0.0.1:4173',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
})
