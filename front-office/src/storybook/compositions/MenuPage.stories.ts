import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { expect, userEvent, within } from "storybook/test";
import { shallowRef } from "vue";

import MenuPage from "../../components/compositions/MenuPage.vue";

const meta = {
  title: "Compositions/MenuPage",
  component: MenuPage,
} satisfies Meta<typeof MenuPage>;
export default meta;
type Story = StoryObj<typeof meta>;
const categories = [
  { id: "coffee", title: "Кофе" },
  { id: "season", title: "Сезонные напитки с очень длинным названием" },
];
const products = [
  {
    id: "cappuccino",
    categoryId: "coffee",
    name: "Капучино",
    description: "Классический кофе с молочной пеной.",
    kind: "DRINK" as const,
    price: 249,
    available: true,
  },
  {
    id: "raf",
    categoryId: "coffee",
    name: "Сезонный раф",
    kind: "DRINK" as const,
    price: 319,
    available: false,
  },
  {
    id: "seasonal-latte",
    categoryId: "season",
    name: "Латте с ежевикой",
    kind: "DRINK" as const,
    price: 329,
    available: true,
  },
];
const args = { categories, products, cartCount: 2, cartTotal: 498 };
export const Ready: Story = {
  args,
  parameters: { viewport: { defaultViewport: "mobile320" } },
  render: (storyArgs) => ({
    components: { MenuPage },
    setup() {
      const cartOpen = shallowRef(false);
      return { cartOpen, storyArgs };
    },
    template: `<MenuPage v-bind="storyArgs" @cart="cartOpen = true" /><p v-if="cartOpen" role="status">Корзина открыта</p>`,
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(
      canvas.getByRole("button", {
        name: "Сезонные напитки с очень длинным названием",
      }),
    );
    await expect(
      canvas.getByRole("heading", { name: "Латте с ежевикой" }),
    ).toBeVisible();
    await userEvent.click(canvas.getByRole("button", { name: "Продолжить" }));
    await expect(canvas.getByText("Корзина открыта")).toBeVisible();
  },
};
export const Loading: Story = {
  args: { ...args, state: "loading" },
  parameters: { viewport: { defaultViewport: "mobile390" } },
};
export const Empty: Story = { args: { ...args, products: [], state: "empty" } };
export const Error: Story = { args: { ...args, state: "error" } };
export const IntakeClosed: Story = {
  args: { ...args, orderIntakeOpen: false },
  parameters: { viewport: { defaultViewport: "tablet768" } },
};
