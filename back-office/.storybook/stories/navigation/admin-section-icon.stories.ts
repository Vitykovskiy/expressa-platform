import type { Meta, StoryObj } from "@storybook/vue3-vite";
import AdminSectionIcon from "../../../src/widgets/admin-shell/AdminSectionIcon.vue";
const meta = {
  title: "Компоненты/Навигация/Иконка раздела",
  id: "navigation-adminsectionicon",
  component: AdminSectionIcon,
  args: { section: "orders", size: 24 },
} satisfies Meta<typeof AdminSectionIcon>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Orders: Story = { name: "Заказы" };
export const Availability: Story = {
  name: "Доступность",
  args: { section: "availability" },
};
export const Menu: Story = { name: "Меню", args: { section: "menu" } };
