import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { expect } from "storybook/test";

import PageShell from "./PageShell.vue";

const meta = {
  title: "Foundations/Page shell",
  component: PageShell,
  args: {
    title: "Очередь",
    description:
      "Очередь заказов будет доступна после публикации соответствующего API.",
  },
  render: (args) => ({
    components: { PageShell },
    setup: () => ({ args }),
    template: '<main><PageShell v-bind="args" /></main>',
  }),
} satisfies Meta<typeof PageShell>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvas }) => {
    await expect(
      canvas.getByRole("heading", { name: "Очередь" }),
    ).toBeVisible();
    await expect(
      canvas.getByText(
        "Очередь заказов будет доступна после публикации соответствующего API.",
      ),
    ).toBeVisible();
  },
};

export const LongContent: Story = {
  args: {
    title: "Управление доступностью и составом меню",
    description:
      "Экран сохраняет читаемую структуру, когда рабочее описание содержит длинный текст и уточняет ограничение до публикации API.",
  },
};

export const WithSupplementaryContent: Story = {
  render: (args) => ({
    components: { PageShell },
    setup: () => ({ args }),
    template:
      '<main><PageShell v-bind="args"><p>Дополнительные сведения для оператора.</p></PageShell></main>',
  }),
  play: async ({ canvas }) => {
    await expect(
      canvas.getByText("Дополнительные сведения для оператора."),
    ).toBeVisible();
  },
};
