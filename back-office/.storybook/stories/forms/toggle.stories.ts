import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { shallowRef } from "vue";
import AdminToggle from "../../../src/shared/ui/admin/admin-toggle/AdminToggle.vue";

const meta = {
  title: "Forms/AdminToggle",
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

export const On: Story = { args: { modelValue: true }, render };
export const Off: Story = { args: { modelValue: false }, render };
export const Disabled: Story = {
  args: { modelValue: true, disabled: true },
  render,
};
