import type { Meta, StoryObj } from "@storybook/vue3-vite";
import CartItem from "@/features/checkout/CartItem.vue";
import type { CartItem as CartItemModel } from "@/entities/customer/model/customer.types";

type CartItemStoryArgs = {
  item: CartItemModel;
  unavailable?: boolean;
  onRemoveItem: (itemId: string) => void;
  onUpdateQuantity: (itemId: string, nextQuantity: number) => void;
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
    onRemoveItem: () => undefined,
    onUpdateQuantity: () => undefined,
  },
  argTypes: {
    item: { control: "object", description: "Доменная позиция корзины." },
    onRemoveItem: {
      control: false,
      description: "Получает itemId при удалении.",
    },
    onUpdateQuantity: {
      control: false,
      description: "Получает itemId и следующее количество.",
    },
  },
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Строка корзины. Контракт: item, updateQuantity(itemId, nextQuantity) и removeItem(itemId); CartScreen владеет валидацией, empty/error и итогом. Длинные additions переносятся, уменьшение отключено при количестве 1, remove имеет имя. Используйте только внутри списка корзины. Источник: src/features/checkout/CartItem.vue.",
      },
    },
  },
  tags: ["autodocs"],
  render: (args) => ({
    components: { CartItem },
    setup: () => ({ args }),
    template:
      '<ul aria-label="Позиции в корзине" style="margin: 0; padding: 0; list-style: none"><CartItem :item="args.item" :unavailable="args.unavailable" @remove-item="args.onRemoveItem" @update-quantity="args.onUpdateQuantity" /></ul>',
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
        {
          id: "oat-milk",
          name: "Овсяное молоко с ванильным сиропом, дополнительная пенка и карамельная посыпка",
          priceRub: 0,
        },
        {
          id: "caramel",
          name: "Карамельный сироп с очень длинным описанием для проверки переноса строки в позиции корзины",
          priceRub: 0,
        },
      ],
      quantity: 2,
      lineTotalRub: 640,
    },
  },
};
export const Remove: Story = {
  args: {
    item: {
      id: "cart-cappuccino",
      productId: "cappuccino",
      productName: "Капучино",
      type: "drink",
      size: "M",
      addons: [],
      quantity: 1,
      lineTotalRub: 320,
    },
  },
};

export const Unavailable: Story = {
  args: { unavailable: true },
};
