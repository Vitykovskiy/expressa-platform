import type { StorybookConfig } from "@storybook/vue3-vite";
import vuetify from "vite-plugin-vuetify";

const config: StorybookConfig = {
  stories: ["./stories/**/*.stories.ts"],
  framework: {
    name: "@storybook/vue3-vite",
    options: {},
  },
  async viteFinal(viteConfig) {
    viteConfig.plugins = viteConfig.plugins
      ?.flat()
      .filter((plugin) => !plugin.name.startsWith("vite-plugin-pwa"));
    viteConfig.plugins ??= [];
    viteConfig.plugins.push(vuetify({ autoImport: true }));

    return viteConfig;
  },
};

export default config;
