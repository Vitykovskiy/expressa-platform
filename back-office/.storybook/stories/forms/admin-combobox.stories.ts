import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { shallowRef } from "vue";
import AdminCombobox from "../../../src/shared/ui/admin/admin-combobox/AdminCombobox.vue";

const options = [
  { id: "coffee", label: "Кофе" },
  {
    id: "seasonal",
    label:
      "Сезонные напитки с альтернативным молоком и дополнительными настройками",
  },
];

const meta = {
  title: "Базовые элементы/Выбор с поиском",
  id: "forms-admincombobox",
  component: AdminCombobox,
  args: { modelValue: "coffee", options },
  parameters: { layout: "padded" },
} satisfies Meta<typeof AdminCombobox>;

export default meta;
type Story = StoryObj<typeof meta>;

function render(args: Story["args"]) {
  return {
    components: { AdminCombobox },
    setup: () => ({ args, modelValue: shallowRef(args.modelValue) }),
    template: '<AdminCombobox v-bind="args" v-model="modelValue" />',
  };
}

export const Selected: Story = { name: "Выбрано", render };
export const Loading: Story = {
  name: "Загрузка",
  args: { loading: true },
  render,
};
export const Disabled: Story = {
  name: "Недоступно",
  args: { disabled: true },
  render,
};
export const LongOption: Story = {
  name: "Длинный вариант",
  args: { modelValue: "seasonal" },
  render,
};
