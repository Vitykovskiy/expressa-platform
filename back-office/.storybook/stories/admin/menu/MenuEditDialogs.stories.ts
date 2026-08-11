import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { shallowRef } from "vue";

import type {
  Category,
  Product,
} from "../../../../src/pages/admin/menu/catalog.types";
import type { CategoryFormData } from "../../../../src/pages/admin/menu/AddCategoryDialog.types";
import type { ProductFormData } from "../../../../src/pages/admin/menu/AddProductDialog.types";
import EditCategoryDialog from "../../../../src/pages/admin/menu/EditCategoryDialog.vue";
import EditProductDialog from "../../../../src/pages/admin/menu/EditProductDialog.vue";

const categories: readonly Category[] = [
  {
    id: "coffee",
    name: "Кофе",
    description: "Горячие напитки",
    sortOrder: 0,
    isActive: true,
  },
  {
    id: "tea",
    name: "Чай",
    description: "Чайные напитки",
    sortOrder: 1,
    isActive: true,
  },
];
const drink: Product = {
  id: "cappuccino",
  categoryId: "coffee",
  type: "DRINK",
  name: "Капучино",
  description: "Кофе с молоком",
  priceMinor: null,
  sortOrder: 0,
  isActive: true,
  isAvailable: true,
  variants: [
    {
      id: "s",
      productId: "cappuccino",
      size: "S",
      priceMinor: 190,
      sortOrder: 0,
      isAvailable: true,
    },
    {
      id: "m",
      productId: "cappuccino",
      size: "M",
      priceMinor: 220,
      sortOrder: 1,
      isAvailable: true,
    },
    {
      id: "l",
      productId: "cappuccino",
      size: "L",
      priceMinor: 250,
      sortOrder: 2,
      isAvailable: true,
    },
  ],
};
const other: Product = {
  id: "cookie",
  categoryId: "coffee",
  type: "OTHER",
  name: "Печенье",
  description: "Песочное",
  priceMinor: 12000,
  sortOrder: 2,
  isActive: true,
  isAvailable: true,
  variants: [],
};

const meta = {
  title: "Admin/Menu/Edit dialogs",
  parameters: { layout: "centered" },
} satisfies Meta;
export default meta;
type CategoryStory = StoryObj<{
  onSave: (data: CategoryFormData) => void;
  onArchive: (id: string) => void;
  onCancel: () => void;
}>;
type ProductStory = StoryObj<{
  onSave: (data: ProductFormData) => void;
  onDelete: () => void;
  onCancel: () => void;
}>;
function categoryRender(
  args: CategoryStory["args"],
  fieldErrors: Record<string, string> = {},
) {
  return {
    components: { EditCategoryDialog },
    setup: () => ({
      args,
      category: categories[0],
      fieldErrors,
      open: shallowRef(false),
    }),
    template: `<button type="button" @click="open = true">Открыть категорию</button><EditCategoryDialog v-model:open="open" :category="category" :field-errors="fieldErrors" @save="args.onSave" @archive="args.onArchive" @cancel="args.onCancel" />`,
  };
}
function productRender(
  args: ProductStory["args"],
  product: Product,
  fieldErrors: Record<string, string> = {},
) {
  return {
    components: { EditProductDialog },
    setup: () => ({
      args,
      categories,
      product,
      fieldErrors,
      open: shallowRef(false),
    }),
    template: `<button type="button" @click="open = true">Открыть товар</button><EditProductDialog v-model:open="open" :categories="categories" :product="product" :field-errors="fieldErrors" @save="args.onSave" @delete="args.onDelete" @cancel="args.onCancel" />`,
  };
}

export const EditCategory: CategoryStory = {
  args: {
    onSave: () => undefined,
    onArchive: () => undefined,
    onCancel: () => undefined,
  },
  render: (args) => categoryRender(args),
};
export const EditCategoryServerFieldError: CategoryStory = {
  args: {
    onSave: () => undefined,
    onArchive: () => undefined,
    onCancel: () => undefined,
  },
  render: (args) =>
    categoryRender(args, {
      description: "Описание категории слишком длинное",
    }),
};
export const EditDrinkSizesSML: ProductStory = {
  args: {
    onSave: () => undefined,
    onDelete: () => undefined,
    onCancel: () => undefined,
  },
  render: (args) =>
    productRender(args, {
      ...drink,
      variants: [
        { ...drink.variants[1], sortOrder: 0 },
        { ...drink.variants[0], sortOrder: 1 },
        { ...drink.variants[2], sortOrder: 2 },
      ],
    }),
};
export const EditDrinkOnlyS: ProductStory = {
  args: {
    onSave: () => undefined,
    onDelete: () => undefined,
    onCancel: () => undefined,
  },
  render: (args) =>
    productRender(args, {
      ...drink,
      variants: [
        { ...drink.variants[1], sortOrder: 0 },
        { ...drink.variants[2], sortOrder: 1 },
      ],
    }),
};
export const EditOther: ProductStory = {
  args: {
    onSave: () => undefined,
    onDelete: () => undefined,
    onCancel: () => undefined,
  },
  render: (args) => productRender(args, other),
};
export const EditProductServerFieldError: ProductStory = {
  args: {
    onSave: () => undefined,
    onDelete: () => undefined,
    onCancel: () => undefined,
  },
  render: (args) =>
    productRender(args, other, {
      description: "Описание товара слишком длинное",
      isActive: "Подтвердите активность товара",
    }),
};
