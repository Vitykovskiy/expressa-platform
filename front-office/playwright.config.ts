import { defineConfig, devices } from '@playwright/test'

const storybook = process.env.PLAYWRIGHT_TARGET === 'storybook'

export default defineConfig({
  expect: {
    toHaveScreenshot: {
      animations: 'disabled',
      caret: 'hide',
      scale: 'css',
    },
  },
  snapshotPathTemplate: '{testDir}/__screenshots__/{testFilePath}/{arg}{ext}',
  outputDir: '/tmp/expressa-front-office-playwright-results',
  testDir: storybook ? './scripts' : './tests/e2e',
  testMatch: storybook ? 'visual.spec.mjs' : '**/*.spec.ts',
  use: {
    ...devices['Desktop Chrome'],
    baseURL: storybook ? 'http://127.0.0.1:6006' : 'http://127.0.0.1:4173',
    viewport: { height: 844, width: 390 },
  },
  webServer: {
    command: storybook
      ? 'npm run storybook:build && npx http-server /tmp/expressa-front-office-storybook -p 6006 -c-1'
      : 'VITE_APP_ENV=local VITE_API_BASE_URL=http://127.0.0.1:3000 npm run build && vite preview --host 127.0.0.1 --port 4173',
    reuseExistingServer: !process.env.CI,
    url: storybook ? 'http://127.0.0.1:6006' : 'http://127.0.0.1:4173',
  },
})
