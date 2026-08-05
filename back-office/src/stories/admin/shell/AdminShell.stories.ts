import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { expect, fn, userEvent, within } from "storybook/test";
import { createNavigationItems } from "../../../app/navigation";
import type { NavigationItem } from "../../../app/navigation.types";
import type {
  AdminSection,
  UserRole,
} from "../../../admin/shared/ui/Admin.types";
import OrdersScreen from "../../../admin/pages/orders/OrdersScreen.vue";
import AdminShell from "../../../admin/shell/AdminShell.vue";
import TopBar from "../../../admin/shell/TopBar.vue";
import { createOrderFixtures } from "../fixtures";

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
  items: readonly NavigationItem[];
  activeSection: AdminSection;
  onNavigate: (section: AdminSection) => void;
  onLogout: () => void;
  onTopBarAction: () => void;
}>;
function renderAdministrator(args: Story["args"]) {
  return {
    components: { AdminShell, OrdersScreen },
    setup: () => ({ args, orders: createOrderFixtures() }),
    template:
      '<AdminShell v-bind="args"><OrdersScreen :orders="orders" /></AdminShell>',
  };
}

function renderBarista(args: Story["args"]) {
  return {
    components: { AdminShell, TopBar },
    setup: () => ({ args }),
    template:
      '<AdminShell v-bind="args"><TopBar title="Заказы" @action="args.onTopBarAction"><template #action>Обновить</template></TopBar><div style="min-height:1200px;padding:16px">Контент раздела</div></AdminShell>',
  };
}
export const Administrator: Story = {
  args: {
    role: "administrator",
    items: createNavigationItems("administrator"),
    activeSection: "orders",
    onNavigate: fn(),
    onLogout: fn(),
    onTopBarAction: fn(),
  },
  render: renderAdministrator,
  parameters: { viewport: { defaultViewport: "desktop" } },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    const orders = canvas.getByRole("button", { name: "Очередь" });
    await expect(orders).toHaveAttribute("aria-current", "page");
    await expect(canvas.getByRole("button", { name: "Меню" })).toBeVisible();
    await expect(
      canvas.queryByRole("button", { name: "Действие" }),
    ).not.toBeInTheDocument();
    await userEvent.click(canvas.getByRole("button", { name: "Меню" }));
    await expect(args.onNavigate).toHaveBeenCalledWith("menu");

    const viewportWidth =
      canvasElement.ownerDocument.documentElement.clientWidth;
    const logout =
      canvasElement.querySelector<HTMLButtonElement>(".side-nav-logout");
    await expect(logout).toBeInTheDocument();
    if (viewportWidth >= 768) {
      await expect(logout).toBeVisible();
      await userEvent.click(logout!);
      await expect(args.onLogout).toHaveBeenCalledTimes(1);
    } else {
      await expect(logout).not.toBeVisible();
    }
  },
};

export const AdministratorVisual: Story = {
  args: Administrator.args,
  render: renderAdministrator,
  parameters: Administrator.parameters,
};

export const Barista: Story = {
  args: {
    role: "barista",
    items: createNavigationItems("barista"),
    activeSection: "availability",
    onNavigate: fn(),
    onLogout: fn(),
    onTopBarAction: fn(),
  },
  render: renderBarista,
  globals: { viewport: { value: "mobile1", isRotated: false } },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    const availability = canvas.getByRole("button", { name: "Доступность" });
    await expect(availability).toHaveAttribute("aria-current", "page");
    await expect(
      canvas.queryByRole("button", { name: "Меню" }),
    ).not.toBeInTheDocument();
    await userEvent.click(canvas.getByRole("button", { name: "Очередь" }));
    await expect(args.onNavigate).toHaveBeenCalledWith("orders");
    const viewportWidth =
      canvasElement.ownerDocument.documentElement.clientWidth;
    const action =
      canvasElement.querySelector<HTMLButtonElement>(".top-bar-action");
    await expect(action).toBeInTheDocument();
    if (viewportWidth < 768) {
      await expect(action).toHaveTextContent("Обновить");
      await expect(action).toBeVisible();
      await userEvent.click(action!);
      await expect(args.onTopBarAction).toHaveBeenCalledTimes(1);
    } else {
      await expect(action).not.toBeVisible();
    }
  },
};

export const BaristaVisual: Story = {
  args: Barista.args,
  render: renderBarista,
  globals: Barista.globals,
};
