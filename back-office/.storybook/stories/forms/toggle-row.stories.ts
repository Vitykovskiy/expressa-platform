import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { shallowRef } from "vue";
import ToggleRow from "../../../src/shared/ui/admin/toggle-row/ToggleRow.vue";
const meta = {
  title: "Компоненты/Формы/Строка переключателя",
  id: "forms-togglerow",
  component: ToggleRow,
  args: {
    label: "Принимать новые заказы",
    modelValue: true,
  },
} satisfies Meta<typeof ToggleRow>;
export default meta;
type Story = StoryObj<typeof meta>;
function render(args: Story["args"]) {
  return {
    components: { ToggleRow },
    setup: () => ({ args, value: shallowRef(args.modelValue) }),
    template: `<ToggleRow v-bind="args" v-model="value" />`,
  };
}
export const Default: Story = { name: "Обычное состояние", render };
export const Disabled: Story = {
  name: "Недоступно",
  args: { disabled: true },
  render,
};
