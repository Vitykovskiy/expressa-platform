import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { shallowRef } from "vue";
import { createNavigationItems } from "../../../src/app/navigation";
import TabBar from "../../../src/widgets/admin-shell/TabBar.vue";

const meta = {
  title: "Компоненты/Навигация/Нижнее меню",
  id: "navigation-tabbar",
  component: TabBar,
  globals: { viewport: "mobile" },
  args: {
    sections: createNavigationItems("administrator").map(
      ({ section, label }) => ({ id: section, label }),
    ),
    activeSection: "orders",
  },
  parameters: { layout: "fullscreen" },
  render: (args) => ({
    components: { TabBar },
    setup() {
      return { args, activeSection: shallowRef(args.activeSection) };
    },
    template:
      '<TabBar v-bind="args" :active-section="activeSection" @select="activeSection = $event" />',
  }),
} satisfies Meta<typeof TabBar>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Orders: Story = { name: "Очередь" };
export const Menu: Story = { name: "Меню", args: { activeSection: "menu" } };
