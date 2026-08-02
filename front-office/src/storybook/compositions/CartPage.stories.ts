import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { expect, userEvent, within } from "storybook/test";

import CartPage from "../../components/compositions/CartPage.vue";

const meta = {
  title: "Compositions/CartPage",
  component: CartPage,
} satisfies Meta<typeof CartPage>;
export default meta;
type Story = StoryObj<typeof meta>;
const initialItems = [
  {
    id: "cappuccino-m",
    name: "Капучино",
    details: "M · Овсяное молоко",
    price: 249,
    quantity: 1,
  },
  {
    id: "cappuccino-l",
    name: "Капучино",
    details: "L · Ванильный сироп",
    price: 319,
    quantity: 2,
  },
];
export const Filled: Story = {
  args: { initialItems },
  parameters: { viewport: { defaultViewport: "mobile390" } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(
      canvas.getAllByRole("button", { name: "Удалить позицию" })[0],
    );
    await expect(canvas.getByLabelText("Итог корзины")).toHaveTextContent(
      "638 ₽",
    );
  },
};
export const Empty: Story = {
  args: { initialItems: [] },
  parameters: { viewport: { defaultViewport: "mobile320" } },
};
export const Wide: Story = {
  args: { initialItems },
  parameters: { viewport: { defaultViewport: "tablet768" } },
};
