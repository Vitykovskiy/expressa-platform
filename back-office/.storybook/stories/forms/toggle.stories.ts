import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { shallowRef } from "vue";
import AdminToggle from "../../../src/shared/ui/admin/admin-toggle/AdminToggle.vue";

const meta = {
  title: "Базовые элементы/Переключатель",
  id: "forms-admintoggle",
  component: AdminToggle,
  args: { modelValue: true },
  parameters: { layout: "padded" },
} satisfies Meta<typeof AdminToggle>;

export default meta;
type Story = StoryObj<typeof meta>;

function render(args: Story["args"]) {
  return {
    components: { AdminToggle },
    setup: () => ({ args, modelValue: shallowRef(args.modelValue) }),
    template:
      '<AdminToggle v-bind="args" :model-value="modelValue" @update:model-value="modelValue = $event" />',
  };
}

export const On: Story = {
  name: "Включён",
  args: { modelValue: true },
  render,
};
export const Off: Story = {
  name: "Выключен",
  args: { modelValue: false },
  render,
};
export const Disabled: Story = {
  name: "Недоступно",
  args: { modelValue: true, disabled: true },
  render,
};
