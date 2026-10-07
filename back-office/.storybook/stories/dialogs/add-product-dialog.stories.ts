import type { Meta, StoryObj } from "@storybook/vue3-vite";
import AddProductDialog from "../../../src/pages/admin/menu/AddProductDialog.vue";
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
