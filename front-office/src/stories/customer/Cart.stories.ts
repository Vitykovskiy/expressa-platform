import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { expect, fn, userEvent, within } from "storybook/test";
import { createPopulatedCartItems } from "./fixtures/customer.fixtures";
import CartScreen from "../../customer/pages/checkout/CartScreen.vue";

const meta = {
  title: "Customer/Screens/Cart",
  component: CartScreen,
  args: {
    items: createPopulatedCartItems(),
    onRemoveItem: fn(),
    onCheckout: fn(),
    onContinueShopping: fn(),
  },
  argTypes: {
    items: { control: "object", description: "Позиции доменной корзины." },
    onRemoveItem: { action: "removeItem" },
    onCheckout: { action: "checkout" },
    onContinueShopping: { action: "continueShopping" },
  },
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Назначение: экран корзины. Используйте для remove, continue и checkout; не используйте для loading/error состояния. Props: items; actions: removeItem, checkout, continueShopping; slots отсутствуют. Состояния: populated, empty, long/addons. Валидация принадлежит checkout flow. Кнопки имеют имена; экран responsive. Источник: src/customer/pages/checkout/CartScreen.vue, src/stories/customer/Cart.stories.ts.",
      },
    },
  },
  tags: ["autodocs"],
} satisfies Meta<typeof CartScreen>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Populated: Story = {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(
      canvas.getByRole("button", { name: "Удалить Капучино" }),
    );
    await expect(args.onRemoveItem).toHaveBeenCalledTimes(1);
    await expect(args.onRemoveItem).toHaveBeenCalledWith("1");
    await userEvent.click(
      canvas.getByRole("button", { name: /Оформить заказ/ }),
    );
    await expect(args.onCheckout).toHaveBeenCalled();
  },
};
export const Empty: Story = {
  args: { items: [] },
  play: async ({ args, canvasElement }) => {
    await userEvent.click(
      within(canvasElement).getByRole("button", { name: "Перейти в меню" }),
    );
    await expect(args.onContinueShopping).toHaveBeenCalled();
  },
};
export const Long: Story = {
  args: {
    items: [
      {
        ...createPopulatedCartItems()[0]!,
        productName:
          "Очень длинное название напитка для проверки переноса в корзине",
      },
    ],
  },
};
