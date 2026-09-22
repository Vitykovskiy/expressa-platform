import type { Meta, StoryObj } from "@storybook/vue3-vite";
import AddCategoryDialog from "../../../src/pages/admin/menu/AddCategoryDialog.vue";
import { category } from "../../fixtures/catalog";
import { dialogHost } from "../../fixtures/hosts";
const meta = {
  title: "Dialogs/AddCategoryDialog",
  component: AddCategoryDialog,
  args: { disabled: false, categories: [category] },
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof AddCategoryDialog>;
export default meta;
type Story = StoryObj<typeof meta>;
function render(args: Story["args"]) {
  return {
    components: { AddCategoryDialog },
    setup: () => ({ ...dialogHost(), args }),
    template: '<AddCategoryDialog v-bind="args" v-model:open="open" />',
  };
}
export const Default: Story = { render };
export const DisabledPending: Story = { args: { disabled: true }, render };
export const Rejected: Story = { args: { saveOutcome: "rejected" }, render };
export const Invalid: Story = {
  args: { fieldErrors: { name: "Введите название категории" } },
  render,
};
