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
    onContinueShopping: fn(),
  },
  argTypes: {
    items: { control: "object", description: "Позиции доменной корзины." },
    onRemoveItem: { action: "removeItem" },
    onUpdateQuantity: { action: "updateQuantity" },
    onCheckout: { action: "checkout" },
    onContinueShopping: { action: "continueShopping" },
  },
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Назначение: экран корзины. Используйте для изменения количества, удаления, продолжения покупки и оформления; не используйте для loading/error состояния. Props: items; actions: updateQuantity, removeItem, checkout, continueShopping; slots отсутствуют. Состояния: populated, empty, long/addons. Валидация принадлежит checkout flow. Кнопки имеют имена; экран responsive. Источник: src/customer/pages/checkout/CartScreen.vue, src/stories/customer/Cart.stories.ts.",
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
      },
    ],
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const summary = canvasElement.querySelector(".cart-screen__summary");

    if (!summary) throw new Error("Cart summary missing");

    await expect(canvas.getByText("21 товар")).toBeVisible();
    await expect(summary).toHaveTextContent(/товар\s*21/);
  },
};
