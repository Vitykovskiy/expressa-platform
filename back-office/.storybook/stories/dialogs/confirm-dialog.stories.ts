import type { Meta, StoryObj } from "@storybook/vue3-vite";
import ConfirmDialog from "../../../src/shared/ui/admin/confirm-dialog/ConfirmDialog.vue";
import { dialogHost } from "../../fixtures/hosts";
const meta = {
  title: "Dialogs/ConfirmDialog",
  component: ConfirmDialog,
  args: {
    title: "Удалить категорию?",
    description: "Действие нельзя отменить.",
    confirmLabel: "Удалить",
    confirmVariant: "destructive",
  },
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof ConfirmDialog>;
export default meta;
type Story = StoryObj<typeof meta>;
function render(args: Story["args"]) {
  return {
    components: { ConfirmDialog },
    setup: () => ({ ...dialogHost(), args }),
    template: '<ConfirmDialog v-bind="args" v-model:open="open" />',
  };
}
export const Destructive: Story = { render };
export const Pending: Story = { args: { pending: true }, render };
export const WithReason: Story = {
  args: { requireInput: true },
  render,
};
export const Long: Story = {
  args: {
    description:
      "Это длинное подтверждение проверяет прокрутку canonical dialog body и сохранение footer actions при содержимом, которое не помещается в обычную высоту экрана. ".repeat(
        8,
      ),
  },
  render,
};
