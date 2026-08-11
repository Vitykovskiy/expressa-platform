import type { Meta, StoryObj } from "@storybook/vue3-vite";
import ProductCard from "@/features/menu/ProductCard.vue";
import type { PublicMenuProduct } from "@/shared/api/public-menu.api";

type ProductCardStoryArgs = {
  product: PublicMenuProduct;
  onSelect: (id: string) => void;
};
const product: PublicMenuProduct = {
  id: "cappuccino",
  name: "Капучино",
  description: "",
  type: "DRINK",
  isAvailable: true,
  modifierGroups: [],
  priceMinor: null,
  variants: [
    { id: "cappuccino-m", size: "M", priceMinor: 26000, isAvailable: true },
  ],
};
const meta = {
  title: "Components/Patterns/ProductCard",
  component: ProductCard,
  args: { product, onSelect: () => undefined },
  argTypes: {
    product: {
      control: "object",
      description: "Товар каталога без demo-логики компонента.",
    },
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
          "Карточка товара каталога. Контракт: product и select(id); экран каталога владеет загрузкой и переходом. Показывает варианты и цену; не вычисляет корзину. Источник: src/features/menu/ProductCard.vue.",
      },
    },
  },
  tags: ["autodocs"],
  render: (args) => ({
    components: { ProductCard },
    setup: () => ({ args }),
    template: '<ProductCard :product="args.product" @select="args.onSelect" />',
  }),
} satisfies Meta<ProductCardStoryArgs>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const SizedPrices: Story = {
  args: {
    product: {
      ...product,
      variants: [
        { id: "cappuccino-s", size: "S", priceMinor: 22000, isAvailable: true },
        { id: "cappuccino-m", size: "M", priceMinor: 26000, isAvailable: true },
      ],
    },
  },
};
export const NoPrice: Story = {
  args: {
    product: { ...product, type: "OTHER", priceMinor: 26000, variants: [] },
  },
};
export const Long: Story = {
  args: {
    product: {
      ...product,
      name: "Капучино с очень длинным названием для проверки переноса в каталоге",
    },
  },
};
