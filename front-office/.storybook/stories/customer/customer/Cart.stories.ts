import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { createPopulatedCartItems } from "./fixtures/customer.fixtures";
import CartScreen from "@/features/checkout/CartScreen.vue";

const meta = {
  title: "Customer/Screens/Cart",
  component: CartScreen,
  args: {
    items: createPopulatedCartItems(),
    onRemoveItem: () => undefined,
    onUpdateQuantity: () => undefined,
    onCheckout: () => undefined,
    onReconfirm: () => undefined,
    onContinueShopping: () => undefined,
  },
  argTypes: {
    items: { control: "object", description: "Позиции доменной корзины." },
    onRemoveItem: { action: "removeItem" },
    onUpdateQuantity: { action: "updateQuantity" },
    onCheckout: { action: "checkout" },
    onReconfirm: { action: "reconfirm" },
    onContinueShopping: { action: "continueShopping" },
  },
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Назначение: экран корзины. Каждая конфигурация показана отдельной строкой; экран отображает недоступность, отправку, ошибку и повторное подтверждение изменившегося итога. Props: items и состояние checkout; actions: updateQuantity, removeItem, checkout, reconfirm, continueShopping. Оплата происходит на кассе при получении. Источник: src/features/checkout/CartScreen.vue.",
      },
    },
  },
  tags: ["autodocs"],
} satisfies Meta<typeof CartScreen>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Populated: Story = {};
export const Empty: Story = {
  args: { items: [] },
};
export const Long: Story = {
  args: {
    items: [
      {
        ...createPopulatedCartItems()[0]!,
        productName:
          "Очень длинное название напитка для проверки переноса в корзине",
        quantity: 21,
        lineTotalRub: 8400,
      },
    ],
  },
};

export const Unavailable: Story = {
  args: {
    unavailableItemIds: ["1"],
  },
};

export const TotalChanged: Story = {
  args: {
    checkoutState: "reconfirmation-required",
    reconfirmedTotalRub: 720,
  },
};

export const Submitting: Story = {
  args: { checkoutState: "submitting" },
};

export const CheckoutError: Story = {
  args: {
    checkoutState: "error",
    errorMessage: "Не удалось связаться с кофейней. Попробуйте ещё раз.",
  },
};
