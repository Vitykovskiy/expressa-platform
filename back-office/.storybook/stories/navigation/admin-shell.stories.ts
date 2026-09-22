import type { Meta, StoryObj } from "@storybook/vue3-vite";
import AdminShell from "../../../src/widgets/admin-shell/AdminShell.vue";

const items = [
  { section: "orders" as const, label: "Заказы" },
  { section: "availability" as const, label: "Доступность" },
  { section: "menu" as const, label: "Меню" },
];
const meta = {
  title: "Layout/AdminShell",
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
export const Administrator: Story = { render };
export const Barista: Story = { args: { role: "barista" }, render };
export const Mobile: Story = {
  globals: { viewport: "mobile" },
  render,
};
