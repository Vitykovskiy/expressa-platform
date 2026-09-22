import type { Meta, StoryObj } from "@storybook/vue3-vite";
import AdminSectionIcon from "../../../src/widgets/admin-shell/AdminSectionIcon.vue";
const meta = {
  title: "Navigation/AdminSectionIcon",
  component: AdminSectionIcon,
  args: { section: "orders", size: 24 },
} satisfies Meta<typeof AdminSectionIcon>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Orders: Story = {};
export const Availability: Story = { args: { section: "availability" } };
export const Menu: Story = { args: { section: "menu" } };
