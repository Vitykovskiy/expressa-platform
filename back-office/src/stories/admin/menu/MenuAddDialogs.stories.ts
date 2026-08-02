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

import AddCategoryDialog from "../../../admin/pages/menu/AddCategoryDialog.vue";
import AddProductDialog from "../../../admin/pages/menu/AddProductDialog.vue";

const meta = {
  title: "Admin/Menu/Add dialogs",
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "Добавление категории и товара. Public events: confirm и cancel; open, option groups и categories — internal story adapter inputs, controls отключены.",
      },
    },
  },
  argTypes: {
    onConfirm: { action: "confirm" },
    onCancel: { action: "cancel" },
  },
} satisfies Meta;
export default meta;

type CategoryStory = StoryObj<{
  onConfirm: (data: unknown) => void;
  onCancel: () => void;
}>;
type ProductStory = StoryObj<{
  onConfirm: (data: unknown) => void;
  onCancel: () => void;
}>;

function body(canvasElement: HTMLElement) {
  return within(canvasElement.ownerDocument.body);
}

function categoryRender(
  args: CategoryStory["args"],
  optionGroups: string[] = [],
) {
  return {
    components: { AddCategoryDialog },
    setup() {
      const open = shallowRef(false);
      return { args, open, optionGroups };
    },
    template: `
      <button type="button" @click="open = true">Открыть категорию</button>
      <AddCategoryDialog
        v-model:open="open"
        :option-groups="optionGroups"
        @confirm="args.onConfirm"
        @cancel="args.onCancel"
      />
    `,
  };
}

function productRender(args: ProductStory["args"]) {
  return {
    components: { AddProductDialog },
    setup() {
      const open = shallowRef(false);
      return { args, open };
    },
    template: `
      <button type="button" @click="open = true">Открыть товар</button>
      <AddProductDialog
        v-model:open="open"
        :categories="['Кофе']"
        @confirm="args.onConfirm"
        @cancel="args.onCancel"
      />
    `,
  };
}

export const AddCategory: CategoryStory = {
  args: { onConfirm: fn(), onCancel: fn() },
  render: (args) => categoryRender(args, ["Тип молока"]),
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    const dialog = body(canvasElement);
    const opener = canvas.getByRole("button", { name: "Открыть категорию" });
    await userEvent.click(opener);
    const name = dialog.getByRole("textbox", { name: "Название группы" });
    await fireEvent.input(name, { target: { value: "Кофе" } });
    await fireEvent.change(
      dialog.getByRole("combobox", { name: "Выбрать группу опций" }),
      { target: { value: "Тип молока" } },
    );
    await fireEvent.click(
      dialog.getByRole("button", { name: "Добавить категорию" }),
    );
    await expect(args.onConfirm).toHaveBeenCalledWith({
      categoryName: "Кофе",
      isOptionGroup: false,
      parentGroupId: "Тип молока",
    });
    await waitFor(() => expect(opener).toHaveFocus());
  },
};

export const CategoryInvalidAndCancel: CategoryStory = {
  args: { onConfirm: fn(), onCancel: fn() },
  render: (args) => categoryRender(args),
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    const dialog = body(canvasElement);
    const opener = canvas.getByRole("button", { name: "Открыть категорию" });
    await userEvent.click(opener);
    await expect(
      dialog.getByRole("button", { name: "Добавить категорию" }),
    ).toBeDisabled();
    await fireEvent.click(dialog.getByRole("button", { name: "Отмена" }));
    await expect(args.onCancel).toHaveBeenCalled();
    await expect(opener).toHaveFocus();
  },
};

export const AddProduct: ProductStory = {
  args: { onConfirm: fn(), onCancel: fn() },
  render: (args) => productRender(args),
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    const dialog = body(canvasElement);
    await userEvent.click(
      canvas.getByRole("button", { name: "Открыть товар" }),
    );
    await fireEvent.change(
      dialog.getByRole("combobox", { name: "Категория" }),
      { target: { value: "Кофе" } },
    );
    await fireEvent.input(
      dialog.getByRole("textbox", { name: "Название товара" }),
      { target: { value: "Капучино" } },
    );
    await fireEvent.input(dialog.getByRole("spinbutton", { name: "Цена, ₽" }), {
      target: { value: "220" },
    });
    await fireEvent.click(
      dialog.getByRole("button", { name: "Добавить товар" }),
    );
    await expect(args.onConfirm).toHaveBeenCalledWith({
      name: "Капучино",
      category: "Кофе",
      price: 220,
    });
  },
};

export const ProductKeyboardEscape: ProductStory = {
  args: { onConfirm: fn(), onCancel: fn() },
  render: (args) => productRender(args),
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    const dialog = body(canvasElement);
    const opener = canvas.getByRole("button", { name: "Открыть товар" });
    await userEvent.click(opener);
    await expect(dialog.getByRole("dialog")).toBeInTheDocument();
    const category = dialog.getByRole("combobox", { name: "Категория" });
    const cancel = dialog.getByRole("button", { name: "Отмена" });
    await waitFor(() => expect(category).toHaveFocus());
    await userEvent.tab({ shift: true });
    await expect(cancel).toHaveFocus();
    await userEvent.tab();
    await expect(category).toHaveFocus();
    await userEvent.keyboard("{Escape}");
    await expect(args.onCancel).toHaveBeenCalled();
    await waitFor(() => expect(opener).toHaveFocus());
  },
};
