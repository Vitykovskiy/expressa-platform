import type { Meta, StoryObj } from "@storybook/vue3-vite";
import TabBar from "../../../src/widgets/admin-shell/TabBar.vue";
const sections = [
  { id: "orders" as const, label: "Заказы" },
  { id: "availability" as const, label: "Доступность" },
  { id: "menu" as const, label: "Меню" },
];
const meta = {
  title: "Компоненты/Навигация/Нижнее меню",
  id: "navigation-tabbar",
  component: TabBar,
  globals: { viewport: "mobile" },
  args: { sections, activeSection: "orders" },
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof TabBar>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Orders: Story = { name: "Заказы" };
export const Menu: Story = { name: "Меню", args: { activeSection: "menu" } };
