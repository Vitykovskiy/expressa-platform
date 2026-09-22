import type { Meta, StoryObj } from "@storybook/vue3-vite";
import ModifierOptionEditor from "../../../src/pages/admin/menu/ModifierOptionEditor.vue";
import { shallowRef } from "vue";
const meta = {
  title: "Forms/ModifierOptionEditor",
  component: ModifierOptionEditor,
  args: {
    modelValue: {
      name: "Овсяное",
      priceDelta: "60",
      isDefault: false,
      isAvailable: true,
    },
  },
  parameters: { layout: "padded" },
} satisfies Meta<typeof ModifierOptionEditor>;
export default meta;
type Story = StoryObj<typeof meta>;
function render(args: Story["args"]) {
  return {
    components: { ModifierOptionEditor },
    setup: () => ({
      args,
      value: shallowRef({
        ...args.modelValue,
      }),
    }),
    template: '<ModifierOptionEditor v-bind="args" v-model="value" />',
  };
}
export const Default: Story = { render };
// Ordering and deletion are intentionally owned by ModifierGroupEditor, where
// sibling position is known. This direct story remains field-only.
export const Middle: Story = { render };
export const Validation: Story = {
  args: {
    fieldErrors: {
      name: "Введите название",
      priceDelta: "Укажите изменение цены",
    },
  },
  render,
};
export const Disabled: Story = { args: { disabled: true }, render };
