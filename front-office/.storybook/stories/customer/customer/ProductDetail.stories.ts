import type { Meta, StoryObj } from "@storybook/vue3-vite";
import ProductDetailScreen from "@/features/menu/ProductDetailScreen.vue";
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
    onSubmit: () => undefined,
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

export const Default: Story = {};

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
};
export const SizeChanged: Story = {};
export const SizeChangedVisual: Story = {};
export const AddonSelected: Story = {};
export const QuantityChanged: Story = {};
export const MinimumQuantity: Story = {};
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
