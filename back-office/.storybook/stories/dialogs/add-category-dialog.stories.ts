import type { Meta, StoryObj } from "@storybook/vue3-vite";
import AddCategoryDialog from "../../../src/pages/admin/menu/AddCategoryDialog.vue";
import AdminButton from "../../../src/shared/ui/admin/admin-button/AdminButton.vue";
import { shallowRef } from "vue";
import { category } from "../../fixtures/catalog";
import { dialogHost } from "../../fixtures/hosts";
const meta = {
  title: "Бизнес компоненты/Меню/Добавление категории",
  id: "dialogs-addcategorydialog",
  component: AddCategoryDialog,
  args: { disabled: false, categories: [category] },
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof AddCategoryDialog>;
export default meta;
type Story = StoryObj<typeof meta>;
function render(args: Story["args"]) {
  return {
    components: { AddCategoryDialog },
    setup: () => ({ ...dialogHost(), args }),
    template: '<AddCategoryDialog v-bind="args" v-model:open="open" />',
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
  args: { fieldErrors: { name: "Введите название категории" } },
  render,
};
export const Reopen: Story = {
  name: "Повторное открытие",
  render: (args) => ({
    components: { AddCategoryDialog, AdminButton },
    setup: () => ({ args, open: shallowRef(false) }),
    template: `<AdminButton @click="open = true">Новая категория</AdminButton><AddCategoryDialog v-bind="args" v-model:open="open" />`,
  }),
};
