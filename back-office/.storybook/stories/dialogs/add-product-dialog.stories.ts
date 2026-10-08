import type { Meta, StoryObj } from "@storybook/vue3-vite";
import AddProductDialog from "../../../src/pages/admin/menu/AddProductDialog.vue";
import AdminButton from "../../../src/shared/ui/admin/admin-button/AdminButton.vue";
import { shallowRef } from "vue";
import { category } from "../../fixtures/catalog";
import { dialogHost } from "../../fixtures/hosts";
const meta = {
  title: "Бизнес компоненты/Меню/Добавление товара",
  id: "dialogs-addproductdialog",
  component: AddProductDialog,
  args: { disabled: false, categories: [category] },
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof AddProductDialog>;
export default meta;
type Story = StoryObj<typeof meta>;
function render(args: Story["args"]) {
  return {
    components: { AddProductDialog },
    setup: () => ({ ...dialogHost(), args }),
    template: '<AddProductDialog v-bind="args" v-model:open="open" />',
  };
}
export const Default: Story = { name: "Обычное состояние", render };
export const DisabledPending: Story = {
  name: "Ожидание и блокировка",
  args: { disabled: true },
  render,
};
export const Invalid: Story = {
  name: "Некорректное значение",
  args: { fieldErrors: { name: "Введите название товара" } },
  render,
};
export const LongCategories: Story = {
  name: "Длинные названия категорий",
  args: {
    categories: [
      category,
      { ...category, id: "tea", name: "Чай" },
      {
        ...category,
        id: "long",
        name: "Кофе с дополнительным молоком и сезонными добавками",
      },
      {
        ...category,
        id: "unbroken",
        name: "Оченьдлинноеназваниекатегориибезпробеловдляузкогоэкрана",
      },
    ],
  },
  render,
};
export const EmptyCategories: Story = {
  name: "Нет категорий",
  args: { categories: [] },
  render,
};
export const Reopen: Story = {
  name: "Повторное открытие",
  render: (args) => ({
    components: { AddProductDialog, AdminButton },
    setup: () => ({ args, open: shallowRef(false) }),
    template:
      '<AdminButton @click="open = true">Новый товар</AdminButton><AddProductDialog v-bind="args" v-model:open="open" />',
  }),
};
export const PendingAfterConfirm: Story = {
  name: "Ожидание после отправки",
  render: (args) => ({
    components: { AddProductDialog },
    setup: () => ({ args, open: shallowRef(true), pending: shallowRef(false) }),
    template:
      '<AddProductDialog v-bind="args" v-model:open="open" :disabled="pending" @confirm="pending = true" />',
  }),
};
