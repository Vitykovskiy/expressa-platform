import type { Meta, StoryObj } from "@storybook/vue3-vite";
import SideNav from "../../../src/widgets/admin-shell/SideNav.vue";
const sections = [
  { id: "orders" as const, label: "Заказы" },
  { id: "availability" as const, label: "Доступность" },
  { id: "menu" as const, label: "Меню" },
];
const meta = {
  title: "Компоненты/Навигация/Боковое меню",
  id: "navigation-sidenav",
  component: SideNav,
  globals: { viewport: "desktop" },
  args: { role: "administrator", activeSection: "orders", sections },
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof SideNav>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Administrator: Story = { name: "Администратор" };
export const Barista: Story = { name: "Бариста", args: { role: "barista" } };
export const AvailabilityActive: Story = {
  name: "Раздел доступности",
  args: { activeSection: "availability" },
};
