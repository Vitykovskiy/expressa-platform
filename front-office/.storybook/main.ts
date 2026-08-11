import type { StorybookConfig } from "@storybook/vue3-vite";
import vuetify from "vite-plugin-vuetify";

const config: StorybookConfig = {
  stories: ["./stories/**/*.stories.ts"],
  addons: ["@storybook/addon-docs", "@storybook/addon-a11y"],
  framework: "@storybook/vue3-vite",
  async viteFinal(config) {
    config.plugins ??= [];
    config.plugins.push(vuetify({ autoImport: true }));

    return config;
  },
};

export default config;
