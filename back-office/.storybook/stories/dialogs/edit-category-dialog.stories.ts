import type { Meta, StoryObj } from "@storybook/vue3-vite";
import EditCategoryDialog from "../../../src/pages/admin/menu/EditCategoryDialog.vue";
import { category } from "../../fixtures/catalog";
import { dialogHost } from "../../fixtures/hosts";
const meta = {
  title: "Dialogs/EditCategoryDialog",
  component: EditCategoryDialog,
  args: { disabled: false, category, categories: [category] },
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof EditCategoryDialog>;
export default meta;
type Story = StoryObj<typeof meta>;
function render(args: Story["args"]) {
  return {
    components: { EditCategoryDialog },
    setup: () => ({ ...dialogHost(), args }),
    template: '<EditCategoryDialog v-bind="args" v-model:open="open" />',
  };
}
export const Default: Story = { render };
export const DisabledPendingSave: Story = { args: { disabled: true }, render };
export const ArchivePending: Story = { args: { archivePending: true }, render };
export const Rejected: Story = { args: { saveOutcome: "rejected" }, render };
export const Invalid: Story = {
  args: { fieldErrors: { name: "Введите название категории" } },
  render,
};
