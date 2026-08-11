import type { Meta, StoryObj } from "@storybook/vue3-vite";

import type {
  Category,
  Product,
} from "../../../../src/pages/admin/menu/catalog.types";
import MenuCategoryGroup from "../../../../src/pages/admin/menu/MenuCategoryGroup.vue";

const category: Category = {
  id: "coffee",
  name: "Кофе",
  description: "Горячие напитки",
  sortOrder: 0,
  isActive: true,
};
const products: readonly Product[] = [
  {
    id: "cappuccino",
    categoryId: "coffee",
    type: "DRINK",
    name: "Капучино",
    description: "",
    priceMinor: null,
    sortOrder: 0,
    isActive: true,
    isAvailable: true,
    variants: [
      {
        id: "s",
        productId: "cappuccino",
        size: "S",
        priceMinor: 19000,
        sortOrder: 0,
        isAvailable: true,
      },
      {
        id: "m",
        productId: "cappuccino",
        size: "M",
        priceMinor: 22000,
        sortOrder: 1,
        isAvailable: true,
      },
      {
        id: "l",
        productId: "cappuccino",
        size: "L",
        priceMinor: 25000,
        sortOrder: 2,
        isAvailable: true,
      },
    ],
  },
];
const managementProducts: readonly Product[] = [
  ...products,
  {
    id: "latte",
    categoryId: "coffee",
    type: "DRINK",
    name: "Латте",
    description: "",
    priceMinor: null,
    sortOrder: 1,
    isActive: true,
    isAvailable: true,
    variants: [
      {
        id: "latte-s",
        productId: "latte",
        size: "S",
        priceMinor: 20000,
        sortOrder: 0,
        isAvailable: true,
      },
    ],
  },
];
const meta = {
  title: "Admin/Menu/Parts",
  component: MenuCategoryGroup,
  parameters: { layout: "fullscreen" },
  args: {
    canMoveUp: true,
    canMoveDown: true,
    disabled: false,
  },
} satisfies Meta<typeof MenuCategoryGroup>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Collapsed: Story = {
  args: {
    category,
    products,
    expanded: false,
    onToggle: () => undefined,
    "onEdit-category": () => undefined,
    onEdit: () => undefined,
    onMoveUp: () => undefined,
    onMoveDown: () => undefined,
    onMoveProductUp: () => undefined,
    onMoveProductDown: () => undefined,
  },
};
export const ExpandedDrinkSML: Story = {
  args: {
    category,
    products,
    expanded: true,
    onToggle: () => undefined,
    "onEdit-category": () => undefined,
    onEdit: () => undefined,
    onMoveUp: () => undefined,
    onMoveDown: () => undefined,
    onMoveProductUp: () => undefined,
    onMoveProductDown: () => undefined,
  },
};
export const Management: Story = {
  args: {
    category,
    products: managementProducts,
    expanded: true,
    showManagementActions: true,
    canMoveUp: true,
    canMoveDown: true,
    disabled: false,
    onToggle: () => undefined,
    "onEdit-category": () => undefined,
    onEdit: () => undefined,
    onMoveUp: () => undefined,
    onMoveDown: () => undefined,
    onMoveProductUp: () => undefined,
    onMoveProductDown: () => undefined,
  },
};
export const Empty: Story = {
  args: { category, products: [], expanded: true },
};
export const LongContent: Story = {
  parameters: { viewport: { defaultViewport: "mobile1" } },
  args: {
    category: {
      ...category,
      name: "Очень длинное название категории для узкого экрана и проверки переноса",
    },
    products: [
      {
        ...products[0],
        name: "Очень длинное название напитка с подробным описанием состава",
      },
    ],
    expanded: true,
    disabled: true,
  },
};
