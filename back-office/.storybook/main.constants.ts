import type { StorybookConfig } from "@storybook/vue3-vite";

export const storybookConfiguration: StorybookConfig = {
  stories: ["../src/**/*.stories.constants.ts"],
  framework: { name: "@storybook/vue3-vite", options: { docgen: false } },
  experimental_indexers: async (indexers) =>
    (indexers ?? []).map((indexer) =>
      indexer.test.test("UiButton.stories.ts")
        ? { ...indexer, test: /\.stories\.constants\.ts$/ }
        : indexer,
    ),
  addons: [],
  previewHead: (head) => `${head}<link rel="icon" href="data:,">`,
  core: { disableTelemetry: true },
};
