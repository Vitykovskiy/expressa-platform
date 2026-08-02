import { router } from "./router";

import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { expect } from "storybook/test";
import { defineComponent, h } from "vue";

import App from "./App.vue";

const meta = {
  title: "Compositions/Navigation",
  component: App,
  render: () => {
    void router.replace("/queue");

    return defineComponent({
      setup: () => () => h(App),
    });
  },
} satisfies Meta<typeof App>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("link", { name: "Очередь" })).toBeVisible();
    await expect(
      canvas.getByRole("link", { name: "Доступность" }),
    ).toBeVisible();
    await expect(canvas.getByRole("link", { name: "Меню" })).toBeVisible();
  },
};
