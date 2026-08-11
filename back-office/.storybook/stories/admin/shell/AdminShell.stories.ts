import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { createNavigationItems } from "../../../../src/app/navigation";
import type { NavigationItem } from "../../../../src/app/navigation.types";
import type {
  AdminSection,
  UserRole,
} from "../../../../src/shared/ui/admin/Admin.types";
import OrdersScreen from "../../../../src/pages/admin/orders/OrdersScreen.vue";
import AdminShell from "../../../../src/widgets/admin-shell/AdminShell.vue";
import TopBar from "../../../../src/widgets/admin-shell/TopBar.vue";
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
    onNavigate: () => undefined,
    onLogout: () => undefined,
    onTopBarAction: () => undefined,
  },
  render: renderAdministrator,
  parameters: { viewport: { defaultViewport: "desktop" } },
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
    onNavigate: () => undefined,
    onLogout: () => undefined,
    onTopBarAction: () => undefined,
  },
  render: renderBarista,
  globals: { viewport: { value: "mobile1", isRotated: false } },
};

export const BaristaVisual: Story = {
  args: Barista.args,
  render: renderBarista,
  globals: Barista.globals,
};
