import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { expect, fn, userEvent, within } from "storybook/test";
import ProductDetailScreen from "../../customer/pages/menu/ProductDetailScreen.vue";
import {
  createCustomerDefaults,
  createPopulatedCartItems,
} from "./fixtures/customer.fixtures";

const fixtures = createCustomerDefaults();
const category = fixtures.categories[1]!;
const product = category.products[0]!;

const meta = {
  title: "Customer/Screens/ProductDetail",
  component: ProductDetailScreen,
  args: {
    category,
    product,
    onSubmit: fn(),
  },
  argTypes: {
    category: { control: "object", description: "Категория товара." },
    product: { control: "object", description: "Доменные данные товара." },
    cartItem: {
      control: "object",
      description: "Позиция редактирования или undefined для add.",
    },
    onSubmit: {
      action: "submit",
      description: "Передаёт выбранную позицию корзины.",
    },
  },
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Назначение: детали товара и выбор параметров корзины. Используйте для add/edit; не используйте без product. Props: category, product, cartItem; emit/action: submit; slots отсутствуют. Состояния: add, edit, size, addons, quantity и long. Валидация количества и доступных option принадлежит screen. Controls доступны кнопками и responsive. Источник: src/customer/pages/menu/ProductDetailScreen.vue, src/stories/customer/ProductDetail.stories.ts.",
      },
    },
  },
  tags: ["autodocs"],
} satisfies Meta<typeof ProductDetailScreen>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    const smallSize = canvas.getByRole("button", { name: /S · 280 ₽/ });
    const mediumSize = canvas.getByRole("button", { name: /M · 320 ₽/ });
    const oatMilk = canvas.getByRole("button", { name: /Овсяное молоко/ });
    const decreaseQuantity = canvas.getByRole("button", {
      name: "Уменьшить количество",
    });

    await expect(smallSize).toHaveAttribute("aria-pressed", "true");
    await expect(oatMilk).toHaveAttribute("aria-pressed", "false");
    await expect(canvas.getByLabelText("Количество")).toHaveTextContent("1");

    await userEvent.click(mediumSize);
    await userEvent.click(oatMilk);
    await userEvent.click(
      canvas.getByRole("button", { name: "Увеличить количество" }),
    );
    await userEvent.click(canvas.getByRole("button", { name: /Добавить/ }));
    await expect(args.onSubmit).toHaveBeenCalledTimes(1);
    await expect(args.onSubmit).toHaveBeenCalledWith(
      {
        productId: "cappuccino",
        productName: "Капучино",
        type: "drink",
        size: "M",
        sizePrice: 320,
        addons: [{ id: "oat-milk", name: "Овсяное молоко", priceRub: 80 }],
        quantity: 2,
        lineTotalRub: 800,
      },
      undefined,
    );

    await userEvent.click(smallSize);
    await userEvent.click(oatMilk);
    await userEvent.click(decreaseQuantity);
    (canvasElement.ownerDocument.activeElement as HTMLElement | null)?.blur();
    await expect(smallSize).toHaveAttribute("aria-pressed", "true");
    await expect(oatMilk).toHaveAttribute("aria-pressed", "false");
    await expect(canvas.getByLabelText("Количество")).toHaveTextContent("1");
    await expect(canvasElement.ownerDocument.activeElement).toBe(
      canvasElement.ownerDocument.body,
    );
  },
};

export const Edit: Story = {
  args: {
    cartItem: createPopulatedCartItems()[0],
  },
  play: async ({ args, canvasElement }) => {
    await userEvent.click(
      within(canvasElement).getByRole("button", { name: /Изменить/ }),
    );
    await expect(args.onSubmit).toHaveBeenCalledTimes(1);
    await expect(args.onSubmit).toHaveBeenCalledWith(
      {
        productId: "cappuccino",
        productName: "Капучино",
        type: "drink",
        size: "M",
        sizePrice: 320,
        addons: [{ id: "oat-milk", name: "Овсяное молоко", priceRub: 80 }],
        quantity: 2,
        lineTotalRub: 800,
      },
      "1",
    );
  },
};
export const SizeChanged: Story = {
  play: async ({ canvasElement }) => {
    const button = within(canvasElement).getByRole("button", {
      name: /L · 360 ₽/,
    });
    await userEvent.click(button);
    await expect(button).toHaveAttribute("aria-pressed", "true");
  },
};
export const SizeChangedVisual: Story = {
  play: async (context) => {
    await SizeChanged.play?.(context);

    const { canvasElement } = context;
    const canvas = within(canvasElement);
    const document = canvasElement.ownerDocument;
    const view = document.defaultView;
    if (!view) throw new Error("Story canvas requires a window.");
    const sizeButtons = canvas.getAllByRole("button", {
      name: /^[SML] · \d+ ₽$/,
    });
    const largeSize = canvas.getByRole("button", { name: /L · 360 ₽/ });

    await expect(sizeButtons[0]).toHaveTextContent("S · 280 ₽");
    await expect(sizeButtons[1]).toHaveTextContent("M · 320 ₽");
    await expect(sizeButtons[2]).toHaveTextContent("L · 360 ₽");
    await expect(largeSize).toHaveAttribute("aria-pressed", "true");
    await expect(canvas.getByText("360 ₽", { selector: "p" })).toBeVisible();
    await expect(
      canvas.getByRole("button", { name: /Добавить · 360 ₽/ }),
    ).toBeVisible();

    (document.activeElement as HTMLElement | null)?.blur();
    view.scrollTo(0, 0);
    document.documentElement.scrollTo(0, 0);
    document.body.scrollTo(0, 0);
    document.querySelector<HTMLElement>("#storybook-root")?.scrollTo(0, 0);
    document.querySelectorAll<HTMLElement>("*").forEach((element) => {
      if (
        element.scrollHeight > element.clientHeight ||
        element.scrollWidth > element.clientWidth
      ) {
        element.scrollTo(0, 0);
      }
    });
    await new Promise<void>((resolve) => {
      view.requestAnimationFrame(() => {
        view.requestAnimationFrame(() => resolve());
      });
    });
  },
};
export const AddonSelected: Story = {
  play: async ({ canvasElement }) => {
    const button = within(canvasElement).getByRole("button", {
      name: /Овсяное молоко/,
    });
    await userEvent.click(button);
    await expect(button).toHaveAttribute("aria-pressed", "true");
  },
};
export const QuantityChanged: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(
      canvas.getByRole("button", { name: "Увеличить количество" }),
    );
    await expect(canvas.getByLabelText("Количество")).toHaveTextContent("2");
    await userEvent.click(
      canvas.getByRole("button", { name: "Уменьшить количество" }),
    );
    await expect(canvas.getByLabelText("Количество")).toHaveTextContent("1");
  },
};
export const MinimumQuantity: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(
      canvas.getByRole("button", { name: "Уменьшить количество" }),
    );
    await expect(canvas.getByLabelText("Количество")).toHaveTextContent("1");
  },
};
export const Long: Story = {
  args: {
    product: {
      ...product,
      name: "Капучино с очень длинным названием для проверки переноса и доступности",
      description:
        "Очень длинное описание товара для проверки адаптивного переноса содержимого на узких экранах.",
    },
  },
};
