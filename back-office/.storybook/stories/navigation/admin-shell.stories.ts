import type { Meta, StoryObj } from "@storybook/vue3-vite";
import AdminShell from "../../../src/widgets/admin-shell/AdminShell.vue";

const items = [
  { section: "orders" as const, label: "Заказы" },
  { section: "availability" as const, label: "Доступность" },
  { section: "menu" as const, label: "Меню" },
];
const meta = {
  title: "Компоненты/Навигация/Оболочка приложения",
  id: "layout-adminshell",
  component: AdminShell,
  globals: { viewport: "desktop" },
  args: { role: "administrator", activeSection: "orders", items },
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof AdminShell>;
export default meta;
type Story = StoryObj<typeof meta>;
function render(args: Story["args"]) {
  return {
    components: { AdminShell },
    setup: () => ({ args }),
    template:
      '<AdminShell v-bind="args"><section><h1>Заказы</h1></section></AdminShell>',
  };
}
export const Administrator: Story = { name: "Администратор", render };
export const Barista: Story = {
  name: "Бариста",
  args: { role: "barista" },
  render,
};
export const Mobile: Story = {
  name: "Мобильный вид",
  globals: { viewport: "mobile" },
  render,
};
