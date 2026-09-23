import type { Meta, StoryObj } from "@storybook/vue3-vite";
import AdminRequestStatePanel from "../../../src/shared/ui/admin/request-state-panel/AdminRequestStatePanel.vue";

const meta = {
  title: "Feedback/AdminRequestStatePanel",
  component: AdminRequestStatePanel,
  args: {
    title: "Не удалось обновить список",
    actionLabel: "Повторить",
  },
  parameters: { layout: "padded" },
} satisfies Meta<typeof AdminRequestStatePanel>;

export default meta;
type Story = StoryObj<typeof meta>;

function render(args: Story["args"]) {
  return {
    components: { AdminRequestStatePanel },
    setup: () => ({ args }),
    template: '<AdminRequestStatePanel v-bind="args" />',
  };
}

export const Error: Story = { render };
export const Pending: Story = {
  args: { pending: true, pendingLabel: "Повторяем…" },
  render,
};
export const LongCopy: Story = {
  args: {
    title: "Не удалось обновить список позиций выбранной категории",
  },
  render,
};
