import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { expect, fn, userEvent, within } from "storybook/test";
import type {
  AdminSection,
  UserRole,
} from "../../../admin/shared/ui/Admin.types";
import AdminShell from "../../../admin/shell/AdminShell.vue";
import TopBar from "../../../admin/shell/TopBar.vue";

const meta = {
  title: "Admin/Shell",
  component: AdminShell,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Admin shell. Public props: role и activeSection; public events: navigate и logout. TopBar action — slot content story, не AdminShell contract. Mobile/desktop проверяются отдельными viewport stories.",
      },
    },
  },
  argTypes: {
    role: { control: "select", options: ["administrator", "barista"] },
    activeSection: {
      control: "select",
      options: ["orders", "menu", "availability", "users", "settings"],
    },
    onNavigate: { action: "navigate" },
    onLogout: { action: "logout" },
  },
} satisfies Meta<typeof AdminShell>;
export default meta;
type Story = StoryObj<{
  role: UserRole;
  activeSection: AdminSection;
  onNavigate: (section: AdminSection) => void;
  onLogout: () => void;
}>;
function render(args: Story["args"]) {
  return {
    components: { AdminShell, TopBar },
    setup: () => ({ args, onTopBarAction: fn() }),
    template:
      '<AdminShell v-bind="args"><TopBar title="Заказы" @action="onTopBarAction"><template #action>Обновить</template></TopBar><div style="min-height:1200px;padding:16px">Контент раздела</div></AdminShell>',
  };
}
export const Administrator: Story = {
  args: {
    role: "administrator",
    activeSection: "orders",
    onNavigate: fn(),
    onLogout: fn(),
  },
  render,
  parameters: { viewport: { defaultViewport: "desktop" } },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    const orders = canvas.getByRole("button", { name: "Заказы" });
    await expect(orders).toHaveAttribute("aria-current", "page");
    await expect(canvas.getByRole("button", { name: "Меню" })).toBeVisible();
    await expect(
      canvas.queryByRole("button", { name: "Действие" }),
    ).not.toBeInTheDocument();
    await userEvent.click(canvas.getByRole("button", { name: "Меню" }));
    await userEvent.click(canvas.getByRole("button", { name: "Выйти" }));
    await expect(args.onNavigate).toHaveBeenCalledWith("menu");
    await expect(args.onLogout).toHaveBeenCalledTimes(1);
  },
};

export const Barista: Story = {
  args: {
    role: "barista",
    activeSection: "availability",
    onNavigate: fn(),
    onLogout: fn(),
  },
  render,
  globals: { viewport: { value: "mobile1", isRotated: false } },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    const availability = canvas.getByRole("button", { name: "Доступность" });
    await expect(availability).toHaveAttribute("aria-current", "page");
    await expect(
      canvas.queryByRole("button", { name: "Меню" }),
    ).not.toBeInTheDocument();
    await userEvent.click(canvas.getByRole("button", { name: "Заказы" }));
    await expect(args.onNavigate).toHaveBeenCalledWith("orders");
    const action = canvas.getByRole("button", { name: "Действие" });
    await expect(action).toBeVisible();
    await userEvent.click(action);
  },
};
