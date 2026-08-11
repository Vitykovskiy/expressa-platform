import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { expect, within } from "storybook/test";

import PageShell from "@/pages/PageShell.vue";

const meta = {
  component: PageShell,
  title: "Foundations/PageShell",
} satisfies Meta<typeof PageShell>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Standard: Story = {
  args: {
    description: "Короткое описание раздела.",
    title: "Заголовок страницы",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByRole("heading", { level: 1 })).toHaveTextContent(
      "Заголовок страницы",
    );
    await expect(canvas.getByText("Короткое описание раздела.")).toBeVisible();
  },
};

export const LongContent: Story = {
  args: {
    description:
      "Подробное описание раздела с длинным названием, которое остаётся читаемым на узком экране и не выходит за его границы.",
    title: "Очень длинный заголовок страницы для проверки переноса содержимого",
  },
};
