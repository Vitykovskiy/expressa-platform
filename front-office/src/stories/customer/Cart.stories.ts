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
    onUpdateQuantity: fn(),
    onCheckout: fn(),
    onReconfirm: fn(),
    onContinueShopping: fn(),
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
          "Назначение: экран корзины. Каждая конфигурация показана отдельной строкой; экран отображает недоступность, отправку, ошибку и повторное подтверждение изменившегося итога. Props: items и состояние checkout; actions: updateQuantity, removeItem, checkout, reconfirm, continueShopping. Оплата происходит на кассе при получении. Источник: src/customer/pages/checkout/CartScreen.vue.",
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
    const summary = canvasElement.querySelector(".cart-screen__summary");
    const decrement = canvas.getByRole("button", {
      name: "Уменьшить количество Капучино",
    });
    const decrementGlyph = decrement.querySelector("svg");

    if (!decrementGlyph || !summary) throw new Error("Cart controls missing");

    await expect(canvas.getByText("2 товара")).toBeVisible();
    const paymentMessages = canvas.getAllByText(
      "Оплата на кассе при получении",
    );
    await expect(
      paymentMessages.some((message) => message.offsetParent !== null),
    ).toBe(true);
    await expect(summary).toHaveTextContent(/товара\s*2/);
    await expect(decrementGlyph).toBeVisible();
    await expect(decrementGlyph.getBoundingClientRect().width).toBeGreaterThan(
      0,
    );
    await expect(decrementGlyph.getBoundingClientRect().height).toBeGreaterThan(
      0,
    );
    await userEvent.click(decrement);
    await expect(args.onUpdateQuantity).toHaveBeenCalledWith("1", 1);
    await userEvent.click(
      canvas.getByRole("button", { name: "Увеличить количество Капучино" }),
    );
    await expect(args.onUpdateQuantity).toHaveBeenCalledWith("1", 3);
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
    const canvas = within(canvasElement);
    const emptyIcon = canvasElement.querySelector(".cart-screen__empty-icon");
    const emptyIconGlyph = canvasElement.querySelector(
      ".cart-screen__empty-icon-glyph",
    );

    if (!emptyIcon || !emptyIconGlyph)
      throw new Error("Empty cart icon missing");

    await expect(canvas.getByText("0 товаров")).toBeVisible();
    await expect(emptyIcon).toBeVisible();
    await expect(emptyIconGlyph).toBeVisible();
    await expect(emptyIcon).toHaveStyle({ borderRadius: "50%" });
    await expect(emptyIconGlyph).toHaveStyle({ color: "rgb(255, 255, 255)" });
    const wrapperRect = emptyIcon.getBoundingClientRect();
    const glyphRect = emptyIconGlyph.getBoundingClientRect();

    await expect(glyphRect.left).toBeGreaterThanOrEqual(wrapperRect.left);
    await expect(glyphRect.top).toBeGreaterThanOrEqual(wrapperRect.top);
    await expect(glyphRect.right).toBeLessThanOrEqual(wrapperRect.right);
    await expect(glyphRect.bottom).toBeLessThanOrEqual(wrapperRect.bottom);
    await userEvent.click(
      canvas.getByRole("button", { name: "Перейти в меню" }),
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
        quantity: 21,
        lineTotalRub: 8400,
      },
    ],
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const summary = canvasElement.querySelector(".cart-screen__summary");

    if (!summary) throw new Error("Cart summary missing");

    await expect(canvas.getByText("21 товар")).toBeVisible();
    await expect(summary).toHaveTextContent(/товар\s*21/);
    await expect(summary).toHaveTextContent(/Итого\s*8\s*400 ₽/);
  },
};

export const Unavailable: Story = {
  args: {
    unavailableItemIds: ["1"],
  },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByText("Проверьте корзину")).toBeVisible();
    await expect(
      canvas.getByText("Удалите недоступные позиции, чтобы продолжить."),
    ).toBeVisible();
    await expect(
      canvas.getByRole("button", { name: /Оформить заказ/ }),
    ).toBeDisabled();
    await userEvent.click(
      canvas.getByRole("button", { name: "Удалить Капучино" }),
    );
    await expect(args.onRemoveItem).toHaveBeenCalledWith("1");
  },
};

export const TotalChanged: Story = {
  args: {
    checkoutState: "reconfirmation-required",
    reconfirmedTotalRub: 720,
  },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByText("Итог изменился")).toBeVisible();
    await expect(canvas.getAllByText("Предыдущий итог").length).toBe(2);
    await expect(canvas.getAllByText("Новый итог").length).toBe(2);
    await expect(canvas.getAllByText("800 ₽").length).toBeGreaterThanOrEqual(2);
    await expect(canvas.getAllByText("720 ₽").length).toBe(2);
    await expect(canvas.getByText("Цена до обновления")).toBeVisible();
    await userEvent.click(
      canvas.getByRole("button", { name: /Подтвердить новый итог/ }),
    );
    await expect(args.onReconfirm).toHaveBeenCalled();
  },
};

export const Submitting: Story = {
  args: { checkoutState: "submitting" },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    const controls = [
      canvas.getByRole("button", { name: "Уменьшить количество Капучино" }),
      canvas.getByRole("button", { name: "Увеличить количество Капучино" }),
      canvas.getByRole("button", { name: "Удалить Капучино" }),
    ];

    for (const control of controls) {
      await expect(control).toBeDisabled();
      control.click();
    }

    await expect(args.onUpdateQuantity).not.toHaveBeenCalled();
    await expect(args.onRemoveItem).not.toHaveBeenCalled();
  },
};

export const CheckoutError: Story = {
  args: {
    checkoutState: "error",
    errorMessage: "Не удалось связаться с кофейней. Попробуйте ещё раз.",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByText("Не удалось оформить заказ")).toBeVisible();
    await expect(
      canvas.getByText("Не удалось связаться с кофейней. Попробуйте ещё раз."),
    ).toBeVisible();
  },
};
