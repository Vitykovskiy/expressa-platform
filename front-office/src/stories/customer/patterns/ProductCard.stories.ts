import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { fn } from "storybook/test";
import ProductCard from "../../../customer/pages/menu/ProductCard.vue";
import type { Product } from "../../../customer/shared/model/customer.types";

type ProductCardStoryArgs = {
  product: Product;
  typeLabel: string;
  onSelect: (id: string) => void;
};
const product: Product = {
  id: "cappuccino",
  name: "Капучино",
  description: "",
  type: "drink",
  image: "",
  basePrice: 260,
};
const meta = {
  title: "Components/Patterns/ProductCard",
  component: ProductCard,
  args: { product, typeLabel: "Напиток", onSelect: fn() },
  argTypes: {
    product: {
      control: "object",
      description: "Товар каталога без demo-логики компонента.",
    },
    typeLabel: { control: "text", description: "Локализованный тип товара." },
    onSelect: {
      action: "select",
      description: "Выбор передаёт идентификатор товара.",
    },
  },
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Карточка товара каталога. Контракт: product, typeLabel и select(id); экран каталога владеет загрузкой и переходом. Показывает размеры, отсутствие цены и длинное имя; не вычисляет корзину. Accessibility: вся карточка имеет понятное действие. Источник: src/customer/pages/menu/ProductCard.vue.",
      },
    },
  },
  tags: ["autodocs"],
  render: (args) => ({
    components: { ProductCard },
    setup: () => ({ args }),
    template:
      '<ProductCard :product="args.product" :type-label="args.typeLabel" @select="args.onSelect" />',
  }),
} satisfies Meta<ProductCardStoryArgs>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const SizedPrices: Story = {
  args: {
    product: {
      ...product,
      sizes: [
        { sizeCode: "S", price: 220 },
        { sizeCode: "M", price: 260 },
      ],
    },
  },
};
export const NoPrice: Story = { args: { product: { ...product, sizes: [] } } };
export const Long: Story = {
  args: {
    product: {
      ...product,
      name: "Капучино с очень длинным названием для проверки переноса в каталоге",
    },
  },
};
