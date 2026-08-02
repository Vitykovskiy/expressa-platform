import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { expect, userEvent, within } from "storybook/test";
import CategoryEditorPage from "../../components/compositions/CategoryEditorPage.vue";

const meta = {
  title: "Compositions/CategoryEditorPage",
  component: CategoryEditorPage,
} satisfies Meta<typeof CategoryEditorPage>;
export default meta;
type Story = StoryObj<typeof meta>;
export const ValidationAndSuccess: Story = {
  args: { initial: { name: "Кофе", active: true } },
  parameters: { viewport: { defaultViewport: "tablet768" } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.tab();
    await expect(
      canvas.getByRole("textbox", { name: "Название категории" }),
    ).toHaveFocus();
    const field = canvas.getByRole("textbox", { name: "Название категории" });
    await userEvent.clear(field);
    await userEvent.type(field, "Чай");
    await userEvent.click(
      canvas.getByRole("button", { name: "Сохранить категорию" }),
    );
    await expect(canvas.getByText("Категория сохранена")).toBeVisible();
    await expect(canvasElement.scrollWidth).toBeLessThanOrEqual(
      canvasElement.clientWidth,
    );
  },
};
export const ServerError: Story = {
  parameters: { viewport: { defaultViewport: "wide" } },
  args: {
    initial: { name: "Кофе", active: true },
    serverErrors: { name: "Такая категория уже есть" },
  },
};
