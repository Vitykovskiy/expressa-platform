import type { Meta, StoryObj } from "@storybook/vue3-vite";
import UserActionDialog from "../../../src/pages/admin/users/UserActionDialog.vue";
import { user } from "../../fixtures/catalog";
import { dialogHost } from "../../fixtures/hosts";
const meta = {
  title: "Dialogs/UserActionDialog",
  component: UserActionDialog,
  args: { user, action: "change_role" },
} satisfies Meta<typeof UserActionDialog>;
export default meta;
type Story = StoryObj<typeof meta>;
function render(args: Story["args"]) {
  return {
    components: { UserActionDialog },
    setup: () => ({ ...dialogHost(), args }),
    template: '<UserActionDialog v-bind="args" v-model:open="open" />',
  };
}
export const ChangeRole: Story = { render };
export const Block: Story = { args: { action: "block" }, render };
export const Unblock: Story = {
  args: { action: "unblock", user: { ...user, status: "blocked" } },
  render,
};
