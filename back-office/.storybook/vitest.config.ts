import { fileURLToPath, URL } from 'node:url'

import { storybookTest } from '@storybook/addon-vitest/vitest-plugin'
import { playwright } from '@vitest/browser-playwright'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [
    vue(),
    storybookTest({
      configDir: fileURLToPath(new URL('.', import.meta.url)),
      storybookScript: 'npm run storybook -- --ci --host 127.0.0.1',
    }),
  ],
  test: {
    name: 'storybook',
    setupFiles: [fileURLToPath(new URL('./vitest.setup.ts', import.meta.url))],
    browser: {
      enabled: true,
      headless: true,
      instances: [{ browser: 'chromium' }],
      provider: playwright(),
    },
  },
})
