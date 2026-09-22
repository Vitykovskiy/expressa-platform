import type { Meta, StoryObj } from "@storybook/vue3-vite";
import AddUserDialog from "../../../src/pages/admin/users/AddUserDialog.vue";
import { dialogHost } from "../../fixtures/hosts";
const meta = {
  title: "Dialogs/AddUserDialog",
  component: AddUserDialog,
} satisfies Meta<typeof AddUserDialog>;
export default meta;
type Story = StoryObj<typeof meta>;
function render() {
  return {
    components: { AddUserDialog },
    setup: dialogHost,
    template:
      '<AddUserDialog v-model:open="open" @add="record(\'add\')" @cancel="record(\'cancel\')" />',
  };
}
export const Default: Story = { render };
