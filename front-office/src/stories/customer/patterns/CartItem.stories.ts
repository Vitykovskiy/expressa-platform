import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { expect, fn, userEvent, within } from "storybook/test";
import CartItem from "../../../customer/pages/checkout/CartItem.vue";
import type { CartItem as CartItemModel } from "../../../customer/shared/model/customer.types";

type CartItemStoryArgs = {
  item: CartItemModel;
  onRemoveItem: (itemId: string) => void;
};

const meta = {
  title: "Components/Patterns/CartItem",
  component: CartItem,
  args: {
    item: {
      id: "cart-cappuccino",
      productId: "cappuccino",
      productName: "Капучино",
      type: "drink",
      size: "M",
      addons: [{ id: "oat-milk", name: "Овсяное молоко", priceRub: 0 }],
      quantity: 2,
      lineTotalRub: 640,
    },
    onRemoveItem: fn(),
  },
  argTypes: {
    item: { control: "object", description: "Доменная позиция корзины." },
    onRemoveItem: {
      control: false,
      description: "Получает itemId при удалении.",
    },
  },
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Строка корзины. Контракт: item и removeItem(itemId); CartScreen владеет валидацией, empty/error и итогом. Длинные additions переносятся, remove имеет имя. Используйте только внутри списка корзины. Источник: src/customer/pages/checkout/CartItem.vue.",
      },
    },
  },
  tags: ["autodocs"],
  render: (args) => ({
    components: { CartItem },
    setup: () => ({ args }),
    template:
      '<ul aria-label="Позиции в корзине" style="margin: 0; padding: 0; list-style: none"><CartItem :item="args.item" @remove-item="args.onRemoveItem" /></ul>',
  }),
} satisfies Meta<CartItemStoryArgs>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const LongAddons: Story = {
  args: {
    item: {
      id: "cart-cappuccino",
      productId: "cappuccino",
      productName:
        "Капучино с очень длинным названием для проверки переноса в корзине",
      type: "drink",
      size: "M",
      addons: [
        {
          id: "oat-milk",
          name: "Овсяное молоко с ванильным сиропом, дополнительная пенка и карамельная посыпка",
          priceRub: 0,
        },
      ],
      quantity: 2,
      lineTotalRub: 640,
    },
  },
};
export const Remove: Story = {
  play: async ({ args, canvasElement }) => {
    await userEvent.click(
      within(canvasElement).getByRole("button", { name: "Удалить Капучино" }),
    );
    await expect(args.onRemoveItem).toHaveBeenCalledWith("cart-cappuccino");
  },
};
