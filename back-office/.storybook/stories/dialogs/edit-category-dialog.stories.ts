import type { Meta, StoryObj } from "@storybook/vue3-vite";
import EditCategoryDialog from "../../../src/pages/admin/menu/EditCategoryDialog.vue";
import AdminButton from "../../../src/shared/ui/admin/admin-button/AdminButton.vue";
import { shallowRef } from "vue";
import { category } from "../../fixtures/catalog";
import { dialogHost } from "../../fixtures/hosts";
const meta = {
  title: "Бизнес компоненты/Меню/Редактирование категории",
  id: "dialogs-editcategorydialog",
  component: EditCategoryDialog,
  args: { disabled: false, category, categories: [category] },
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof EditCategoryDialog>;
export default meta;
type Story = StoryObj<typeof meta>;
function render(args: Story["args"]) {
  return {
    components: { EditCategoryDialog },
    setup: () => ({ ...dialogHost(), args }),
    template: '<EditCategoryDialog v-bind="args" v-model:open="open" />',
  };
}
export const Default: Story = { name: "Обычное состояние", render };
export const DisabledPendingSave: Story = {
  name: "Сохранение и блокировка",
  args: { disabled: true },
  render,
};
export const ArchivePending: Story = {
  name: "Архивация",
  args: { archivePending: true },
  render,
};
export const Invalid: Story = {
  name: "Некорректное значение",
  args: { fieldErrors: { name: "Введите название категории" } },
  render,
};
export const Long: Story = {
  name: "Предельные значения",
  args: {
    category: {
      ...category,
      name: "ОченьДлинноеНазваниеКатегорииБезПробелов".repeat(3).slice(0, 80),
      description: "Описание категории ".repeat(20).slice(0, 240),
      isActive: false,
    },
  },
  render,
};
export const Lifecycle: Story = {
  name: "Выбор и повторное открытие",
  render: (args) => ({
    components: { EditCategoryDialog, AdminButton },
    setup: () => ({
      args,
      open: shallowRef(false),
      selected: shallowRef(category),
      category,
      other: {
        ...category,
        id: "tea",
        name: "Чай",
        description: "Чёрный чай",
        isActive: false,
      },
    }),
    template: `<AdminButton @click="selected = category; open = true">Кофе</AdminButton>
      <AdminButton @click="selected = other; open = true">Чай</AdminButton>
      <EditCategoryDialog v-bind="args" :category="selected" v-model:open="open" />`,
  }),
};
