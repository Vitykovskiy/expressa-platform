import type { StorybookConfig } from "@storybook/vue3-vite";

const config: StorybookConfig = {
  stories: ["../src/**/*.stories.ts"],
  addons: ["@storybook/addon-a11y", "@storybook/addon-vitest"],
  framework: "@storybook/vue3-vite",
  viteFinal: async (config) => ({
    ...config,
    plugins: config.plugins
      ?.flat()
      .filter((plugin) => !plugin.name.startsWith("vite-plugin-pwa")),
  }),
};

export default config;
