import type { Meta, StoryObj } from "@storybook/vue3-vite";
import {
  expect,
  fireEvent,
  fn,
  userEvent,
  waitFor,
  within,
} from "storybook/test";
import { onMounted, shallowRef } from "vue";

import type {
  EditMenuCategoryData,
  EditMenuProductData,
  MenuItem,
} from "../../../admin/shared/ui/Admin.types";
import EditCategoryDialog from "../../../admin/pages/menu/EditCategoryDialog.vue";
import EditProductDialog from "../../../admin/pages/menu/EditProductDialog.vue";
import ConfirmDialog from "../../../admin/shared/ui/confirm-dialog/ConfirmDialog.vue";

const meta = {
  title: "Admin/Menu/Edit dialogs",
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "Редактирование категории и товара. Public events: save, delete и cancel; open и исходные данные принадлежат internal story adapter, controls отключены.",
      },
    },
  },
  argTypes: {
    onSave: { action: "save" },
    onDelete: { action: "delete" },
    onCancel: { action: "cancel" },
  },
} satisfies Meta;
export default meta;

type CategoryStory = StoryObj<{
  onSave: (data: EditMenuCategoryData) => void;
  onDelete: () => void;
  onCancel: () => void;
}>;
type ProductStory = StoryObj<{
  onSave: (data: EditMenuProductData) => void;
  onDelete: () => void;
  onCancel: () => void;
}>;

const product: MenuItem = {
  id: "cappuccino",
  name: "Капучино",
  category: "Кофе",
  available: true,
  price: 220,
};

function dialogCanvas(canvasElement: HTMLElement) {
  return within(canvasElement.ownerDocument.body);
}

function categoryRender(
  args: CategoryStory["args"],
  initiallyOpen = false,
  categoryName = "Кофе",
  productCount = 2,
  optionGroups = ["Тип молока"],
  isOptionGroup = false,
  parentGroupId = "",
) {
  return {
    components: { EditCategoryDialog },
    setup() {
      const open = shallowRef(false);

      onMounted(() => {
        open.value = initiallyOpen;
      });

      return {
        args,
        categoryName,
        isOptionGroup,
        open,
        optionGroups,
        parentGroupId,
        productCount,
      };
    },
    template: `
      <button type="button" @click="open = true">Открыть группу</button>
      <EditCategoryDialog v-model:open="open" :category-name="categoryName" :is-option-group="isOptionGroup" :option-groups="optionGroups" :parent-group-id="parentGroupId" :product-count="productCount" @save="args.onSave" @delete="args.onDelete" @cancel="args.onCancel" />
    `,
  };
}

function productRender(args: ProductStory["args"], initiallyOpen = false) {
  return {
    components: { EditProductDialog },
    setup() {
      const open = shallowRef(false);

      onMounted(() => {
        open.value = initiallyOpen;
      });

      return { args, open, product };
    },
    template: `
      <button type="button" @click="open = true">Открыть товар</button>
      <EditProductDialog v-model:open="open" :categories="['Кофе', 'Чай']" :product="product" @save="args.onSave" @delete="args.onDelete" @cancel="args.onCancel" />
    `,
  };
}

export const EditCategory: CategoryStory = {
  args: {
    onSave: fn<(data: EditMenuCategoryData) => void>(),
    onDelete: fn(),
    onCancel: fn(),
  },
  render: (args) => categoryRender(args),
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    const dialog = dialogCanvas(canvasElement);
    const opener = canvas.getByRole("button", { name: "Открыть группу" });

    opener.focus();
    await expect(opener).toHaveFocus();
    await fireEvent.click(opener);
    await fireEvent.input(
      dialog.getByRole("textbox", { name: "Название группы" }),
      { target: { value: "Чай" } },
    );
    await fireEvent.change(
      dialog.getByRole("combobox", { name: "Выбрать группу опций" }),
      { target: { value: "Тип молока" } },
    );
    await fireEvent.click(
      dialog.getByRole("button", { name: "Сохранить изменения" }),
    );
    await expect(args.onSave).toHaveBeenCalledWith({
      newName: "Чай",
      isOptionGroup: false,
      parentGroupId: "Тип молока",
    });
    await waitFor(() => expect(opener).toHaveFocus());
  },
};

export const EditCategoryVisual: CategoryStory = {
  args: {
    onSave: fn<(data: EditMenuCategoryData) => void>(),
    onDelete: fn(),
    onCancel: fn(),
  },
  render: (args) => categoryRender(args, true),
};

export const CategoryInvalidCancelAndDelete: CategoryStory = {
  args: {
    onSave: fn<(data: EditMenuCategoryData) => void>(),
    onDelete: fn(),
    onCancel: fn(),
  },
  render: (args) => categoryRender(args),
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    const dialog = dialogCanvas(canvasElement);
    const opener = canvas.getByRole("button", { name: "Открыть группу" });

    opener.focus();
    await expect(opener).toHaveFocus();
    await fireEvent.click(opener);
    let name = dialog.getByRole("textbox", { name: "Название группы" });

    await waitFor(() => expect(name).toHaveFocus());
    await userEvent.tab({ shift: true });
    const closeButton = dialog.getByRole("button", { name: "Закрыть диалог" });

    await expect(closeButton).toHaveFocus();
    await fireEvent.click(closeButton);
    await expect(args.onCancel).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(opener).toHaveFocus());
    await fireEvent.click(opener);
    name = dialog.getByRole("textbox", { name: "Название группы" });
    await waitFor(() => expect(name).toHaveFocus());
    await userEvent.keyboard("{Escape}");
    await expect(args.onCancel).toHaveBeenCalledTimes(2);
    await waitFor(() => expect(opener).toHaveFocus());
    await fireEvent.click(opener);
    name = dialog.getByRole("textbox", { name: "Название группы" });

    await fireEvent.input(name, { target: { value: "   " } });
    const error = dialog.getByRole("alert");

    await expect(error).toHaveTextContent("Введите название группы");
    await expect(name).toHaveAttribute("aria-invalid", "true");
    await expect(name).toHaveAttribute("aria-describedby", error.id);
    await expect(
      dialog.getByRole("button", { name: "Сохранить изменения" }),
    ).toBeDisabled();
    await userEvent.keyboard("{Enter}");
    await expect(args.onSave).not.toHaveBeenCalled();
    await fireEvent.input(name, { target: { value: "Чай" } });
    await expect(name).toHaveAttribute("aria-invalid", "false");
    await expect(name).not.toHaveAttribute("aria-describedby");
    await expect(dialog.queryByRole("alert")).not.toBeInTheDocument();
    await expect(
      dialog.getByRole("button", { name: "Сохранить изменения" }),
    ).toBeEnabled();
    const parentGroup = dialog.getByRole("combobox", {
      name: "Выбрать группу опций",
    });

    await fireEvent.change(parentGroup, { target: { value: "Тип молока" } });
    await fireEvent.click(dialog.getByRole("switch", { name: "Группа опций" }));
    await expect(
      dialog.queryByRole("combobox", { name: "Выбрать группу опций" }),
    ).not.toBeInTheDocument();
    await fireEvent.click(dialog.getByRole("switch", { name: "Группа опций" }));
    await expect(
      dialog.getByRole("combobox", { name: "Выбрать группу опций" }),
    ).toHaveValue("Тип молока");
    await fireEvent.click(dialog.getByRole("button", { name: "Отмена" }));
    await expect(args.onCancel).toHaveBeenCalledTimes(3);
    await waitFor(() => expect(opener).toHaveFocus());
    opener.focus();
    await fireEvent.click(opener);
    const deleteButton = dialog.getByRole("button", { name: "Удалить группу" });

    deleteButton.focus();
    await fireEvent.click(deleteButton);
    await expect(
      dialog.getByText("Удалить группу «Кофе»?"),
    ).toBeInTheDocument();
    await expect(
      dialog.getByText(/2 товара без возможности/),
    ).toBeInTheDocument();
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(deleteButton).toHaveFocus());
    await fireEvent.click(deleteButton);
    await fireEvent.click(dialog.getByRole("button", { name: "Удалить" }));
    await expect(args.onDelete).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(opener).toHaveFocus());
  },
};

export const CategoryInvalidVisual: CategoryStory = {
  args: {
    onSave: fn<(data: EditMenuCategoryData) => void>(),
    onDelete: fn(),
    onCancel: fn(),
  },
  render: (args) => categoryRender(args, true, "", 2, []),
};

export const EditProduct: ProductStory = {
  args: {
    onSave: fn<(data: EditMenuProductData) => void>(),
    onDelete: fn(),
    onCancel: fn(),
  },
  render: (args) => productRender(args),
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    const dialog = dialogCanvas(canvasElement);
    const opener = canvas.getByRole("button", { name: "Открыть товар" });

    opener.focus();
    await expect(opener).toHaveFocus();
    await fireEvent.click(opener);
    await fireEvent.input(
      dialog.getByRole("textbox", { name: "Название товара" }),
      { target: { value: "Латте" } },
    );
    await fireEvent.change(
      dialog.getByRole("combobox", { name: "Категория" }),
      { target: { value: "Чай" } },
    );
    await fireEvent.input(dialog.getByRole("spinbutton", { name: "Цена, ₽" }), {
      target: { value: "250" },
    });
    await fireEvent.click(
      dialog.getByRole("button", { name: "Сохранить изменения" }),
    );
    await expect(args.onSave).toHaveBeenCalledWith({
      name: "Латте",
      category: "Чай",
      price: 250,
    });
    await waitFor(() => expect(opener).toHaveFocus());
  },
};

export const EditProductVisual: ProductStory = {
  args: {
    onSave: fn<(data: EditMenuProductData) => void>(),
    onDelete: fn(),
    onCancel: fn(),
  },
  render: (args) => productRender(args, true),
};

export const ProductKeyboardFocusAndDelete: ProductStory = {
  args: {
    onSave: fn<(data: EditMenuProductData) => void>(),
    onDelete: fn(),
    onCancel: fn(),
  },
  render: (args) => productRender(args),
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    const dialog = dialogCanvas(canvasElement);
    const opener = canvas.getByRole("button", { name: "Открыть товар" });

    opener.focus();
    await expect(opener).toHaveFocus();
    await fireEvent.click(opener);
    const name = dialog.getByRole("textbox", { name: "Название товара" });

    await waitFor(() => expect(name).toHaveFocus());
    const cancelButton = dialog.getByRole("button", { name: "Отмена" });

    await userEvent.tab({ shift: true });
    await expect(cancelButton).toHaveFocus();
    await userEvent.tab();
    await expect(name).toHaveFocus();
    await userEvent.keyboard("{Escape}");
    await expect(args.onCancel).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(opener).toHaveFocus());
    opener.focus();
    await fireEvent.click(opener);
    const deleteButton = dialog.getByRole("button", { name: "Удалить товар" });

    deleteButton.focus();
    await fireEvent.click(deleteButton);
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(deleteButton).toHaveFocus());
    await fireEvent.click(deleteButton);
    await fireEvent.click(dialog.getByRole("button", { name: "Удалить" }));
    await expect(args.onDelete).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(opener).toHaveFocus());
  },
};

export const ProductDeleteConfirmationVisual: ProductStory = {
  args: { onSave: fn(), onDelete: fn(), onCancel: fn() },
  render: () => ({
    components: { ConfirmDialog },
    setup: () => ({ open: true }),
    template:
      '<ConfirmDialog v-model:open="open" confirm-label="Удалить" confirm-variant="destructive" description="Товар будет удалён без возможности восстановления." title="Удалить товар?" />',
  }),
};
