import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { shallowRef } from "vue";

import type { Category } from "../../../../src/pages/admin/menu/catalog.types";
import type { CategoryFormData } from "../../../../src/pages/admin/menu/AddCategoryDialog.types";
import type { ProductFormData } from "../../../../src/pages/admin/menu/AddProductDialog.types";
import AddCategoryDialog from "../../../../src/pages/admin/menu/AddCategoryDialog.vue";
import AddProductDialog from "../../../../src/pages/admin/menu/AddProductDialog.vue";

const categories: readonly Category[] = [
  {
    id: "coffee",
    name: "Кофе",
    description: "Горячие напитки",
    sortOrder: 0,
    isActive: true,
  },
];

const meta = {
  title: "Admin/Menu/Add dialogs",
  parameters: { layout: "centered" },
} satisfies Meta;
export default meta;

type CategoryStory = StoryObj<{
  onConfirm: (data: CategoryFormData) => void;
  onCancel: () => void;
}>;
type ProductStory = StoryObj<{
  onConfirm: (data: ProductFormData) => void;
  onCancel: () => void;
}>;

function categoryRender(
  args: CategoryStory["args"],
  fieldErrors: Record<string, string> = {},
) {
  return {
    components: { AddCategoryDialog },
    setup: () => ({ args, fieldErrors, open: shallowRef(false) }),
    template: `<button type="button" @click="open = true">Открыть категорию</button><AddCategoryDialog v-model:open="open" :field-errors="fieldErrors" @confirm="args.onConfirm" @cancel="args.onCancel" />`,
  };
}

function productRender(
  args: ProductStory["args"],
  fieldErrors: Record<string, string> = {},
) {
  return {
    components: { AddProductDialog },
    setup: () => ({ args, categories, fieldErrors, open: shallowRef(false) }),
    template: `<button type="button" @click="open = true">Открыть товар</button><AddProductDialog v-model:open="open" :categories="categories" :field-errors="fieldErrors" @confirm="args.onConfirm" @cancel="args.onCancel" />`,
  };
}

export const AddCategory: CategoryStory = {
  args: { onConfirm: () => undefined, onCancel: () => undefined },
  render: (args) => categoryRender(args),
};

export const CategoryServerFieldError: CategoryStory = {
  args: { onConfirm: () => undefined, onCancel: () => undefined },
  render: (args) =>
    categoryRender(args, {
      description: "Описание категории слишком длинное",
    }),
};

export const AddDrinkSizesSML: ProductStory = {
  args: { onConfirm: () => undefined, onCancel: () => undefined },
  render: (args) => productRender(args),
};

export const AddDrinkOnlyS: ProductStory = {
  args: { onConfirm: () => undefined, onCancel: () => undefined },
  render: (args) => productRender(args),
};

export const AddOther: ProductStory = {
  args: { onConfirm: () => undefined, onCancel: () => undefined },
  render: (args) => productRender(args),
};

export const ProductServerFieldError: ProductStory = {
  args: { onConfirm: () => undefined, onCancel: () => undefined },
  render: (args) =>
    productRender(args, {
      description: "Описание товара слишком длинное",
      isAvailable: "Укажите доступность товара",
    }),
};
