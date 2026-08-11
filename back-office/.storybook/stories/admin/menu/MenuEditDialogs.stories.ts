import type { Meta, StoryObj } from "@storybook/vue3-vite";
import {
  expect,
  fireEvent,
  fn,
  userEvent,
  waitFor,
  within,
} from "storybook/test";
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
function dialog(canvasElement: HTMLElement) {
  return within(canvasElement.ownerDocument.body);
}
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
  args: { onSave: fn(), onArchive: fn(), onCancel: fn() },
  render: (args) => categoryRender(args),
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    const body = dialog(canvasElement);
    const opener = canvas.getByRole("button", { name: "Открыть категорию" });
    opener.focus();
    await userEvent.click(opener);
    let name = body.getByRole("textbox", { name: "Название категории" });
    await waitFor(() => expect(name).toHaveFocus());
    await userEvent.tab({ shift: true });
    await expect(
      body.getByRole("button", { name: "Закрыть диалог" }),
    ).toHaveFocus();
    await userEvent.keyboard("{Escape}");
    await expect(args.onCancel).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(opener).toHaveFocus());
    await userEvent.click(opener);
    name = body.getByRole("textbox", { name: "Название категории" });
    await fireEvent.input(name, { target: { value: "Чай" } });
    await fireEvent.click(
      body.getByRole("button", { name: "Сохранить изменения" }),
    );
    await expect(args.onSave).toHaveBeenCalledWith({
      name: "Чай",
      description: "Горячие напитки",
      isActive: true,
    });
  },
};
export const EditCategoryServerFieldError: CategoryStory = {
  args: { onSave: fn(), onArchive: fn(), onCancel: fn() },
  render: (args) =>
    categoryRender(args, {
      description: "Описание категории слишком длинное",
    }),
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    const body = dialog(canvasElement);
    await userEvent.click(
      canvas.getByRole("button", { name: "Открыть категорию" }),
    );
    await expect(
      body.getByText("Описание категории слишком длинное"),
    ).toBeInTheDocument();
    await expect(
      body.getByText("Описание категории слишком длинное"),
    ).toBeInTheDocument();
    await fireEvent.click(
      body.getByRole("button", { name: "Сохранить изменения" }),
    );
    await expect(args.onSave).toHaveBeenCalledWith({
      name: "Кофе",
      description: "Горячие напитки",
      isActive: true,
    });
  },
};
export const EditDrinkSizesSML: ProductStory = {
  args: { onSave: fn(), onDelete: fn(), onCancel: fn() },
  render: (args) =>
    productRender(args, {
      ...drink,
      variants: [
        { ...drink.variants[1], sortOrder: 0 },
        { ...drink.variants[0], sortOrder: 1 },
        { ...drink.variants[2], sortOrder: 2 },
      ],
    }),
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(
      canvas.getByRole("button", { name: "Открыть товар" }),
    );
    const body = dialog(canvasElement);
    for (const size of ["S", "M", "L"])
      await expect(
        body.getByRole("spinbutton", { name: `Цена ${size}, коп.` }),
      ).toBeInTheDocument();
    for (const size of ["S", "M", "L"])
      await expect(
        body.getByRole("switch", { name: `Размер ${size} доступен` }),
      ).toBeInTheDocument();
    const configuredLabels = [
      ...canvasElement.ownerDocument.querySelectorAll(
        ".size-row-heading > strong",
      ),
    ].map((element) => element.textContent?.trim());
    await expect(configuredLabels).toEqual([
      "Использовать размер M",
      "Использовать размер S",
      "Использовать размер L",
    ]);
    await fireEvent.click(
      body.getByRole("button", { name: "Опустить размер M" }),
    );
    await expect(
      [
        ...canvasElement.ownerDocument.querySelectorAll(
          ".size-row-heading > strong",
        ),
      ].map((element) => element.textContent?.trim()),
    ).toEqual([
      "Использовать размер S",
      "Использовать размер M",
      "Использовать размер L",
    ]);
    await fireEvent.click(
      body.getByRole("button", { name: "Сохранить изменения" }),
    );
    await expect(args.onSave).toHaveBeenCalledWith({
      categoryId: "coffee",
      type: "DRINK",
      name: "Капучино",
      description: "Кофе с молоком",
      isActive: true,
      isAvailable: true,
      priceMinor: null,
      variants: [
        {
          id: "s",
          size: "S",
          priceMinor: 190,
          sortOrder: 0,
          isAvailable: true,
        },
        {
          id: "m",
          size: "M",
          priceMinor: 220,
          sortOrder: 1,
          isAvailable: true,
        },
        {
          id: "l",
          size: "L",
          priceMinor: 250,
          sortOrder: 2,
          isAvailable: true,
        },
      ],
    });
  },
};
export const EditDrinkOnlyS: ProductStory = {
  args: { onSave: fn(), onDelete: fn(), onCancel: fn() },
  render: (args) =>
    productRender(args, {
      ...drink,
      variants: [
        { ...drink.variants[1], sortOrder: 0 },
        { ...drink.variants[2], sortOrder: 1 },
      ],
    }),
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    const body = dialog(canvasElement);
    await userEvent.click(
      canvas.getByRole("button", { name: "Открыть товар" }),
    );
    for (const size of ["M", "L"])
      await expect(
        body.getByRole("switch", { name: `Размер ${size} доступен` }),
      ).toBeInTheDocument();
    const useL = body.getByRole("switch", { name: "Использовать размер L" });
    await fireEvent.click(useL);
    await expect(useL).not.toBeChecked();
    await expect(
      body.queryByRole("spinbutton", { name: "Цена L, коп." }),
    ).not.toBeInTheDocument();
    const useS = body.getByRole("switch", { name: "Использовать размер S" });
    await fireEvent.click(useS);
    await expect(useS).toBeChecked();
    await expect(
      body.getByRole("spinbutton", { name: "Цена S, коп." }),
    ).toBeInTheDocument();
    await expect(
      body.getByRole("switch", { name: "Размер S доступен" }),
    ).toBeInTheDocument();
    await fireEvent.input(
      body.getByRole("spinbutton", { name: "Цена S, коп." }),
      { target: { value: "190" } },
    );
    await expect(
      body.getByRole("button", { name: "Сохранить изменения" }),
    ).toBeEnabled();
    await fireEvent.click(
      body.getByRole("button", { name: "Сохранить изменения" }),
    );
    await expect(args.onSave).toHaveBeenCalledWith({
      categoryId: "coffee",
      type: "DRINK",
      name: "Капучино",
      description: "Кофе с молоком",
      isActive: true,
      isAvailable: true,
      priceMinor: null,
      variants: [
        {
          id: "m",
          size: "M",
          priceMinor: 220,
          sortOrder: 0,
          isAvailable: true,
        },
        { size: "S", priceMinor: 190, sortOrder: 1, isAvailable: false },
      ],
    });
  },
};
export const EditOther: ProductStory = {
  args: { onSave: fn(), onDelete: fn(), onCancel: fn() },
  render: (args) => productRender(args, other),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(
      canvas.getByRole("button", { name: "Открыть товар" }),
    );
    await expect(
      dialog(canvasElement).getByRole("spinbutton", { name: "Цена, коп." }),
    ).toHaveValue(12000);
  },
};
export const EditProductServerFieldError: ProductStory = {
  args: { onSave: fn(), onDelete: fn(), onCancel: fn() },
  render: (args) =>
    productRender(args, other, {
      description: "Описание товара слишком длинное",
      isActive: "Подтвердите активность товара",
    }),
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    const body = dialog(canvasElement);
    await userEvent.click(
      canvas.getByRole("button", { name: "Открыть товар" }),
    );
    await expect(
      body.getByText("Описание товара слишком длинное"),
    ).toBeInTheDocument();
    await expect(
      body.getByText("Подтвердите активность товара"),
    ).toBeInTheDocument();
    await fireEvent.input(body.getByRole("textbox", { name: "Описание" }), {
      target: { value: "Песочное с ванилью" },
    });
    await expect(
      body.queryByText("Описание товара слишком длинное"),
    ).not.toBeInTheDocument();
    await expect(
      body.getByText("Подтвердите активность товара"),
    ).toBeInTheDocument();
    await fireEvent.click(body.getByRole("switch", { name: "Товар активен" }));
    await expect(
      body.queryByText("Подтвердите активность товара"),
    ).not.toBeInTheDocument();
    await fireEvent.click(
      body.getByRole("button", { name: "Сохранить изменения" }),
    );
    await expect(args.onSave).toHaveBeenCalledWith({
      categoryId: "coffee",
      type: "OTHER",
      name: "Печенье",
      description: "Песочное с ванилью",
      isActive: false,
      isAvailable: true,
      priceMinor: 12000,
      variants: [],
    });
  },
};
