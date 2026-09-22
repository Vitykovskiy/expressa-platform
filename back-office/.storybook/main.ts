import { defineMain } from "@storybook/vue3-vite/node";

export default defineMain({
  framework: "@storybook/vue3-vite",
  stories: ["./stories/**/*.stories.ts"],
  addons: ["@storybook/addon-docs"],
  async viteFinal(config) {
    return {
      ...config,
      plugins: config.plugins?.filter(
        (plugin) =>
          !(
            plugin &&
            typeof plugin === "object" &&
            "name" in plugin &&
            typeof plugin.name === "string" &&
            plugin.name.startsWith("vite-plugin-pwa")
          ),
      ),
    };
  },
});
