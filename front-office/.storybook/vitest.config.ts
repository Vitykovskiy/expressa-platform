import { fileURLToPath } from "node:url";

import { storybookTest } from "@storybook/addon-vitest/vitest-plugin";
import { playwright } from "@vitest/browser-playwright";
import { mergeConfig } from "vitest/config";

import viteConfig from "../vite.config";

export default mergeConfig(viteConfig, {
  optimizeDeps: {
    include: ["axe-core", "vue"],
  },
  plugins: [
    storybookTest({ configDir: fileURLToPath(new URL(".", import.meta.url)) }),
  ],
  test: {
    browser: {
      enabled: true,
      headless: true,
      instances: [{ browser: "chromium" }],
      provider: playwright(),
    },
    name: "storybook",
    setupFiles: ["./.storybook/vitest.setup.ts"],
  },
});
