import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { expect, fn, userEvent, within } from "storybook/test";
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
    onRemoveItem: fn(),
    onUpdateQuantity: fn(),
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

export const Default: Story = {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    const remove = canvas.getByRole("button", { name: "Удалить Капучино" });
    const decrement = canvas.getByRole("button", {
      name: "Уменьшить количество Капучино",
    });
    const decrementGlyph = decrement.querySelector("svg");
    const quantity = canvasElement.querySelector("output");
    const addons = canvas.getByRole("list", { name: "Добавки" });
    const addonItems = within(addons).getAllByRole("listitem");

    if (!decrementGlyph || !quantity) throw new Error("Cart controls missing");

    await expect(canvas.getByText("Размер M")).toBeVisible();
    await expect(addonItems[0]).toHaveTextContent("+ Овсяное молоко");
    await expect(quantity.tagName).toBe("OUTPUT");
    await expect(decrementGlyph).toBeVisible();
    await expect(decrementGlyph.getBoundingClientRect().width).toBeGreaterThan(
      0,
    );
    await expect(decrementGlyph.getBoundingClientRect().height).toBeGreaterThan(
      0,
    );
    await expect(remove.getBoundingClientRect().width).toBeGreaterThanOrEqual(
      44,
    );
    await expect(remove.getBoundingClientRect().height).toBeGreaterThanOrEqual(
      44,
    );
    await userEvent.click(decrement);
    await expect(args.onUpdateQuantity).toHaveBeenCalledWith(
      "cart-cappuccino",
      1,
    );
    await userEvent.click(
      canvas.getByRole("button", { name: "Увеличить количество Капучино" }),
    );
    await expect(args.onUpdateQuantity).toHaveBeenCalledWith(
      "cart-cappuccino",
      3,
    );
  },
};
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
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const addons = canvas.getByRole("list", { name: "Добавки" });
    const addonItems = within(addons).getAllByRole("listitem");

    await expect(addonItems).toHaveLength(2);
    await expect(addons.textContent).toContain("×2");
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
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    const decrement = canvas.getByRole("button", {
      name: "Уменьшить количество Капучино",
    });

    await expect(decrement).toBeDisabled();
    decrement.click();
    await expect(args.onUpdateQuantity).not.toHaveBeenCalled();
    await userEvent.click(
      canvas.getByRole("button", { name: "Удалить Капучино" }),
    );
    await expect(args.onRemoveItem).toHaveBeenCalledWith("cart-cappuccino");
  },
};

export const Unavailable: Story = {
  args: { unavailable: true },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByText(/Сейчас недоступно/)).toBeVisible();
    await expect(
      canvas.getByRole("button", { name: "Уменьшить количество Капучино" }),
    ).toBeDisabled();
    await expect(
      canvas.getByRole("button", { name: "Увеличить количество Капучино" }),
    ).toBeDisabled();
    await userEvent.click(
      canvas.getByRole("button", { name: "Удалить Капучино" }),
    );
    await expect(args.onRemoveItem).toHaveBeenCalledWith("cart-cappuccino");
  },
};
