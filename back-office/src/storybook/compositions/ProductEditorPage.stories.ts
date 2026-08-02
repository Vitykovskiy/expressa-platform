import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { expect, userEvent, within } from "storybook/test";
import ProductEditorPage from "../../components/compositions/ProductEditorPage.vue";

const meta = {
  title: "Compositions/ProductEditorPage",
  component: ProductEditorPage,
} satisfies Meta<typeof ProductEditorPage>;
export default meta;
type Story = StoryObj<typeof meta>;
export const SizesAndOnePrice: Story = {
  parameters: { viewport: { defaultViewport: "tablet768" } },
  args: {
    initial: {
      name: "Латте",
      kind: "drink",
      price: "",
      variants: { S: 250, M: 320, L: 390 },
    },
    categories: [{ id: "coffee", name: "Кофе", active: true, archived: false }],
    modifierGroup: {
      name: "Молоко",
      categoryId: "coffee",
      required: true,
      mode: "single",
      min: "1",
      max: "1",
    },
    modifierOption: {
      id: "oat",
      name: "Овсяное",
      price: "50",
      defaultFree: false,
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.tab();
    await expect(
      canvas.getByRole("textbox", { name: "Название товара" }),
    ).toHaveFocus();
    await expect(canvas.getByLabelText("Цена S")).toHaveValue(250);
    await expect(canvas.getByLabelText("Цена M")).toHaveValue(320);
    await expect(canvas.getByLabelText("Цена L")).toHaveValue(390);
    await expect(canvasElement.scrollWidth).toBeLessThanOrEqual(
      canvasElement.clientWidth,
    );
  },
};
export const SOnly: Story = {
  parameters: { viewport: { defaultViewport: "workspace" } },
  args: {
    initial: {
      name: "Эспрессо",
      kind: "drink",
      price: "",
      variants: { S: 180 },
    },
  },
};
export const OnePriceAndServerError: Story = {
  parameters: { viewport: { defaultViewport: "wide" } },
  args: {
    initial: { name: "Печенье", kind: "single", price: "120", variants: {} },
    serverErrors: { name: "Такое название уже есть" },
    categories: [{ id: "coffee", name: "Кофе", active: true, archived: false }],
    modifierGroup: {
      name: "Молоко",
      categoryId: "coffee",
      required: true,
      mode: "single",
      min: "1",
      max: "1",
    },
    modifierOption: {
      id: "oat",
      name: "Овсяное",
      price: "50",
      defaultFree: false,
    },
    modifierServerErrors: { name: "Такая группа уже есть" },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      canvas.getByRole("textbox", { name: "Название товара" }),
    ).toHaveValue("Печенье");
    await expect(canvas.getByRole("textbox", { name: "Цена" })).toHaveValue(
      "120",
    );
    await expect(
      canvas.getByRole("textbox", { name: "Название группы" }),
    ).toHaveValue("Молоко");
    await userEvent.clear(
      canvas.getByRole("textbox", { name: "Название группы" }),
    );
    await userEvent.type(
      canvas.getByRole("textbox", { name: "Название группы" }),
      "Растительное молоко",
    );
    await userEvent.click(
      canvas.getByRole("button", { name: "Сохранить группу" }),
    );
    await expect(canvas.getByText("Товар сохранён")).toBeVisible();
    await userEvent.click(
      canvas.getByRole("button", { name: "Сохранить товар" }),
    );
    await expect(canvas.getByText("Товар сохранён")).toBeVisible();
  },
};
