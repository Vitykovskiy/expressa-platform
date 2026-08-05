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

import type { Category } from "../../../admin/pages/menu/catalog.types";
import type { CategoryFormData } from "../../../admin/pages/menu/AddCategoryDialog.types";
import type { ProductFormData } from "../../../admin/pages/menu/AddProductDialog.types";
import AddCategoryDialog from "../../../admin/pages/menu/AddCategoryDialog.vue";
import AddProductDialog from "../../../admin/pages/menu/AddProductDialog.vue";

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

function dialog(canvasElement: HTMLElement) {
  return within(canvasElement.ownerDocument.body);
}

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
  args: { onConfirm: fn(), onCancel: fn() },
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
    await expect(body.getByRole("button", { name: "Отмена" })).toHaveFocus();
    await userEvent.tab();
    await expect(name).toHaveFocus();
    await userEvent.keyboard("{Escape}");
    await expect(args.onCancel).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(opener).toHaveFocus());
    await userEvent.click(opener);
    name = body.getByRole("textbox", { name: "Название категории" });
    await fireEvent.input(name, { target: { value: "Кофе" } });
    await fireEvent.click(
      body.getByRole("button", { name: "Добавить категорию" }),
    );
    await expect(args.onConfirm).toHaveBeenCalledWith({
      name: "Кофе",
      description: "",
      isActive: true,
    });
  },
};

export const CategoryServerFieldError: CategoryStory = {
  args: { onConfirm: fn(), onCancel: fn() },
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
    await fireEvent.input(
      body.getByRole("textbox", { name: "Название категории" }),
      { target: { value: "Десерты" } },
    );
    await fireEvent.click(
      body.getByRole("button", { name: "Добавить категорию" }),
    );
    await expect(args.onConfirm).toHaveBeenCalledWith({
      name: "Десерты",
      description: "",
      isActive: true,
    });
  },
};

export const AddDrinkSizesSML: ProductStory = {
  args: { onConfirm: fn(), onCancel: fn() },
  render: (args) => productRender(args),
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    const body = dialog(canvasElement);
    await userEvent.click(
      canvas.getByRole("button", { name: "Открыть товар" }),
    );
    await fireEvent.change(body.getByRole("combobox", { name: "Категория" }), {
      target: { value: "coffee" },
    });
    await fireEvent.change(body.getByRole("combobox", { name: "Тип товара" }), {
      target: { value: "DRINK" },
    });
    for (const size of ["S", "M", "L"])
      await expect(
        body.getByRole("switch", { name: `Размер ${size} доступен` }),
      ).toBeInTheDocument();
    await fireEvent.input(
      body.getByRole("textbox", { name: "Название товара" }),
      { target: { value: "Капучино" } },
    );
    for (const [size, price] of [
      ["S", "190"],
      ["M", "220"],
      ["L", "250"],
    ] as const) {
      await fireEvent.input(
        body.getByRole("spinbutton", { name: `Цена ${size}, коп.` }),
        { target: { value: price } },
      );
    }
    await fireEvent.input(
      body.getByRole("spinbutton", { name: "Цена S, коп." }),
      { target: { value: "191" } },
    );
    await fireEvent.click(body.getByRole("button", { name: "Добавить товар" }));
    await expect(args.onConfirm).toHaveBeenCalledWith({
      categoryId: "coffee",
      type: "DRINK",
      name: "Капучино",
      description: "",
      isActive: true,
      isAvailable: true,
      priceMinor: null,
      variants: [
        { size: "S", priceMinor: 191, sortOrder: 0, isAvailable: true },
        { size: "M", priceMinor: 220, sortOrder: 1, isAvailable: true },
        { size: "L", priceMinor: 250, sortOrder: 2, isAvailable: true },
      ],
    });
  },
};

export const AddDrinkOnlyS: ProductStory = {
  args: { onConfirm: fn(), onCancel: fn() },
  render: (args) => productRender(args),
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    const body = dialog(canvasElement);
    await userEvent.click(
      canvas.getByRole("button", { name: "Открыть товар" }),
    );
    await fireEvent.change(body.getByRole("combobox", { name: "Тип товара" }), {
      target: { value: "DRINK" },
    });
    await fireEvent.change(body.getByRole("combobox", { name: "Категория" }), {
      target: { value: "coffee" },
    });
    await fireEvent.input(
      body.getByRole("textbox", { name: "Название товара" }),
      { target: { value: "Эспрессо" } },
    );
    await fireEvent.input(
      body.getByRole("spinbutton", { name: "Цена S, коп." }),
      { target: { value: "190" } },
    );
    const useM = body.getByRole("switch", { name: "Использовать размер M" });
    await fireEvent.click(useM);
    await expect(useM).not.toBeChecked();
    await expect(
      body.queryByRole("spinbutton", { name: "Цена M, коп." }),
    ).not.toBeInTheDocument();
    const useL = body.getByRole("switch", { name: "Использовать размер L" });
    await fireEvent.click(useL);
    await expect(useL).not.toBeChecked();
    await expect(
      body.queryByRole("spinbutton", { name: "Цена L, коп." }),
    ).not.toBeInTheDocument();
    await expect(
      body.getByRole("switch", { name: "Использовать размер S" }),
    ).toBeDisabled();
    const sizeAvailable = body.getByRole("switch", {
      name: "Размер S доступен",
    });
    await fireEvent.click(sizeAvailable);
    await expect(sizeAvailable).not.toBeChecked();
    await expect(
      body.getByText(
        "Для активного товара нужен хотя бы один доступный размер",
      ),
    ).toBeInTheDocument();
    await expect(
      body.getByRole("button", { name: "Добавить товар" }),
    ).toBeDisabled();
    const productActive = body.getByRole("switch", { name: "Товар активен" });
    await fireEvent.click(productActive);
    await expect(productActive).not.toBeChecked();
    await expect(
      body.queryByText(
        "Для активного товара нужен хотя бы один доступный размер",
      ),
    ).not.toBeInTheDocument();
    await expect(
      body.getByRole("button", { name: "Добавить товар" }),
    ).toBeEnabled();
    await fireEvent.click(body.getByRole("button", { name: "Добавить товар" }));
    await expect(args.onConfirm).toHaveBeenCalledWith({
      categoryId: "coffee",
      type: "DRINK",
      name: "Эспрессо",
      description: "",
      isActive: false,
      isAvailable: true,
      priceMinor: null,
      variants: [
        { size: "S", priceMinor: 190, sortOrder: 0, isAvailable: false },
      ],
    });
  },
};

export const AddOther: ProductStory = {
  args: { onConfirm: fn(), onCancel: fn() },
  render: (args) => productRender(args),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const body = dialog(canvasElement);
    await userEvent.click(
      canvas.getByRole("button", { name: "Открыть товар" }),
    );
    await expect(
      body.getByRole("spinbutton", { name: "Цена, коп." }),
    ).toBeInTheDocument();
    await expect(
      body.queryByText("Размеры и цены, коп."),
    ).not.toBeInTheDocument();
  },
};

export const ProductServerFieldError: ProductStory = {
  args: { onConfirm: fn(), onCancel: fn() },
  render: (args) =>
    productRender(args, {
      description: "Описание товара слишком длинное",
      isAvailable: "Укажите доступность товара",
    }),
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    const body = dialog(canvasElement);
    const opener = canvas.getByRole("button", { name: "Открыть товар" });
    opener.focus();
    await userEvent.click(opener);
    const category = body.getByRole("combobox", { name: "Категория" });
    await waitFor(() => expect(category).toHaveFocus());
    await userEvent.tab({ shift: true });
    await expect(body.getByRole("button", { name: "Отмена" })).toHaveFocus();
    await userEvent.tab();
    await expect(category).toHaveFocus();
    await userEvent.keyboard("{Escape}");
    await expect(args.onCancel).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(opener).toHaveFocus());
    await userEvent.click(opener);
    await expect(
      body.getByText("Описание товара слишком длинное"),
    ).toBeInTheDocument();
    await expect(
      body.getByText("Укажите доступность товара"),
    ).toBeInTheDocument();
    await fireEvent.input(body.getByRole("textbox", { name: "Описание" }), {
      target: { value: "Песочное печенье" },
    });
    await expect(
      body.queryByText("Описание товара слишком длинное"),
    ).not.toBeInTheDocument();
    await expect(
      body.getByText("Укажите доступность товара"),
    ).toBeInTheDocument();
    await fireEvent.click(body.getByRole("switch", { name: "Товар доступен" }));
    await expect(
      body.queryByText("Укажите доступность товара"),
    ).not.toBeInTheDocument();
    await fireEvent.change(body.getByRole("combobox", { name: "Категория" }), {
      target: { value: "coffee" },
    });
    await fireEvent.input(
      body.getByRole("textbox", { name: "Название товара" }),
      { target: { value: "Печенье" } },
    );
    await fireEvent.input(
      body.getByRole("spinbutton", { name: "Цена, коп." }),
      {
        target: { value: "12000" },
      },
    );
    await fireEvent.click(body.getByRole("button", { name: "Добавить товар" }));
    await expect(args.onConfirm).toHaveBeenCalledWith({
      categoryId: "coffee",
      type: "OTHER",
      name: "Печенье",
      description: "Песочное печенье",
      isActive: true,
      isAvailable: false,
      priceMinor: 12000,
      variants: [],
    });
  },
};
