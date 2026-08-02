import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { expect, userEvent, within } from "storybook/test";

import ProductSheet from "../../components/compositions/ProductSheet.vue";

const meta = {
  title: "Compositions/ProductSheet",
  component: ProductSheet,
} satisfies Meta<typeof ProductSheet>;
export default meta;
type Story = StoryObj<typeof meta>;
const product = {
  name: "Капучино с карамельным сиропом и овсяным молоком",
  basePrice: 219,
  sizes: [
    { id: "s", label: "S", price: 219 },
    { id: "m", label: "M", price: 249 },
  ],
  modifiers: [
    { id: "oat", label: "Овсяное молоко", default: true },
    { id: "vanilla", label: "Ванильный сироп", price: 40 },
  ],
  minModifiers: 1,
  maxModifiers: 2,
};
export const Configurator: Story = {
  args: { product, cartCount: 1 },
  parameters: { viewport: { defaultViewport: "mobile320" } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("radio", { name: "M · 249 ₽" }));
    await expect(canvas.getByText("249 ₽")).toBeVisible();
    await userEvent.click(
      canvas.getByRole("checkbox", { name: "Ванильный сироп +40 ₽" }),
    );
    await expect(canvas.getByText("289 ₽")).toBeVisible();
    await userEvent.click(canvas.getByRole("button", { name: "В корзину" }));
    await expect(canvas.getAllByRole("status")[1]).toHaveTextContent(
      "Товар добавлен",
    );
  },
};
export const Wide: Story = {
  args: { product, cartCount: 1 },
  parameters: { viewport: { defaultViewport: "tablet768" } },
};

export const Mobile: Story = {
  args: { product, cartCount: 1 },
  parameters: { viewport: { defaultViewport: "mobile390" } },
};
