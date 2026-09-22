import type { Meta, StoryObj } from "@storybook/vue3-vite";
import AdminDialog from "../../../src/shared/ui/admin/admin-dialog/AdminDialog.vue";
import { dialogHost } from "../../fixtures/hosts";
const meta = {
  title: "Dialogs/AdminDialog",
  component: AdminDialog,
  args: {
    cancelLabel: "Отмена",
    maxWidth: "480",
    submitForm: "admin-dialog-story-form",
    submitLabel: "Сохранить",
    title: "Диалог",
  },
} satisfies Meta<typeof AdminDialog>;
export default meta;
type Story = StoryObj<typeof meta>;
function render(args: Story["args"]) {
  return {
    components: { AdminDialog },
    setup: () => {
      const host = dialogHost();
      return { ...host, args };
    },
    template:
      '<AdminDialog v-bind="args" v-model="open"><form id="admin-dialog-story-form"><p>Содержимое</p></form></AdminDialog>',
  };
}
export const Default: Story = { render };
export const Persistent: Story = { args: { persistent: true }, render };
export const FullscreenOnMobile: Story = {
  args: { fullScreenBelow600: true },
  render,
};
export const Long: Story = {
  args: { title: "Длинный заголовок диалога для проверки переноса текста" },
  render,
};
