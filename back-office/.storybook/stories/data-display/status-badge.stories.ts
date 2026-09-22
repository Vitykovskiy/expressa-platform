import type { Meta, StoryObj } from "@storybook/vue3-vite";
import StatusBadge from "../../../src/shared/ui/admin/status-badge/StatusBadge.vue";
const meta = {
  title: "Data display/StatusBadge",
  component: StatusBadge,
  args: { status: "Created" },
  parameters: { layout: "padded" },
} satisfies Meta<typeof StatusBadge>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Created: Story = {};
export const Confirmed: Story = { args: { status: "Confirmed" } };
export const Ready: Story = { args: { status: "Ready for pickup" } };
export const Rejected: Story = { args: { status: "Rejected" } };
export const Closed: Story = { args: { status: "Closed" } };
