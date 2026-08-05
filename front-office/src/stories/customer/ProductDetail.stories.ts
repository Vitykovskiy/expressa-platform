import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { expect, fn, userEvent, within } from "storybook/test";
import ProductDetailScreen from "../../customer/pages/menu/ProductDetailScreen.vue";
import { createCustomerDefaults } from "./fixtures/customer.fixtures";

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
          "Назначение: детали товара и выбор параметров корзины. Props: category, product; emit/action: submit. Конфигурация и валидация принадлежат screen.",
      },
    },
  },
  tags: ["autodocs"],
} satisfies Meta<typeof ProductDetailScreen>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const mediumSize = canvas.getByRole("button", {
      name: /M[\s\u00a0]·[\s\u00a0]320[\s\u00a0]₽/,
    });
    const oatMilk = canvas.getByRole("button", { name: /Овсяное молоко/ });

    await expect(mediumSize).toHaveAttribute("aria-pressed", "true");
    await expect(oatMilk).toHaveAttribute("aria-pressed", "false");
    await expect(canvas.getByLabelText("Количество")).toHaveTextContent("1");
  },
};

export const Edit: Story = {
  args: {
    cartItem: {
      id: "1",
      productId: "cappuccino",
      productName: "Капучино",
      type: "DRINK",
      size: "M",
      sizePrice: 320,
      selectedVariant: { id: "cappuccino-m-1", size: "M", priceMinor: 32000 },
      addons: [{ id: "oat-milk", name: "Овсяное молоко", priceRub: 80 }],
      selectedModifierOptions: [
        {
          groupId: "cappuccino-addons",
          id: "oat-milk",
          name: "Овсяное молоко",
          priceDeltaMinor: 8000,
        },
      ],
      quantity: 2,
      unitTotalMinor: 40000,
      lineTotalMinor: 80000,
      lineTotalRub: 800,
    },
  },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByLabelText("Количество")).toHaveTextContent("2");
    await userEvent.click(canvas.getByRole("button", { name: /Изменить/ }));
    await expect(args.onSubmit).toHaveBeenCalledTimes(1);
    await expect(args.onSubmit).toHaveBeenCalledWith(
      {
        productId: "cappuccino",
        productName: "Капучино",
        type: "DRINK",
        size: "M",
        sizePrice: 320,
        addons: [{ id: "oat-milk", name: "Овсяное молоко", priceRub: 80 }],
        quantity: 2,
        lineTotalRub: 800,
        unitTotalMinor: 40000,
        lineTotalMinor: 80000,
        selectedVariant: { id: "cappuccino-m-1", size: "M", priceMinor: 32000 },
        selectedModifierOptions: [
          {
            groupId: "cappuccino-addons",
            id: "oat-milk",
            name: "Овсяное молоко",
            priceDeltaMinor: 8000,
          },
        ],
      },
      "1",
    );
  },
};
export const SizeChanged: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(
      canvas.getByRole("button", {
        name: /L[\s\u00a0]·[\s\u00a0]360[\s\u00a0]₽/,
      }),
    );
    await expect(
      canvas.getByRole("button", {
        name: /L[\s\u00a0]·[\s\u00a0]360[\s\u00a0]₽/,
      }),
    ).toHaveAttribute("aria-pressed", "true");
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
      name: /^[SML][\s\u00a0]·[\s\u00a0]\d+[\s\u00a0]₽$/,
    });
    const largeSize = canvas.getByRole("button", {
      name: /L[\s\u00a0]·[\s\u00a0]360[\s\u00a0]₽/,
    });

    await expect(sizeButtons).toHaveLength(3);
    await expect(sizeButtons[0]).toHaveTextContent(
      /^S[\s\u00a0]·[\s\u00a0]280[\s\u00a0]₽$/,
    );
    await expect(sizeButtons[1]).toHaveTextContent(
      /^M[\s\u00a0]·[\s\u00a0]320[\s\u00a0]₽$/,
    );
    await expect(sizeButtons[2]).toHaveTextContent(
      /^L[\s\u00a0]·[\s\u00a0]360[\s\u00a0]₽$/,
    );
    await expect(largeSize).toHaveAttribute("aria-pressed", "true");
    await expect(canvas.getByText("360 ₽", { selector: "p" })).toBeVisible();
    await expect(
      canvas.getByRole("button", {
        name: /Добавить[\s\u00a0]·[\s\u00a0]360[\s\u00a0]₽/,
      }),
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
