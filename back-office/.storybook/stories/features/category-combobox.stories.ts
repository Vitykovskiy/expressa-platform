import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { shallowRef } from "vue";
import AdminCombobox from "../../../src/shared/ui/admin/admin-combobox/AdminCombobox.vue";
import { category } from "../../fixtures/catalog";

const meta = {
  title: "Features/Menu/CategoryCombobox",
  component: AdminCombobox,
  args: {
    label: "Категория",
    modelValue: category.id,
    options: [{ id: category.id, label: category.name }],
  },
} satisfies Meta<typeof AdminCombobox>;

export default meta;
type Story = StoryObj<typeof meta>;

function render(args: Story["args"]) {
  return {
    components: { AdminCombobox },
    setup: () => {
      const modelValue = shallowRef(args.modelValue);
      return { args, modelValue };
    },
    template:
      '<AdminCombobox v-bind="args" :model-value="modelValue" @update:model-value="modelValue = $event" />',
  };
}

export const Selected: Story = { render };
export const Loading: Story = { args: { loading: true }, render };
export const Disabled: Story = { args: { disabled: true }, render };
export const LongOption: Story = {
  args: {
    options: [
      { id: category.id, label: category.name },
      {
        ...category,
        id: "seasonal",
        label:
          "Сезонные напитки с альтернативным молоком и дополнительными настройками",
      },
    ],
    modelValue: "seasonal",
  },
  render,
};
