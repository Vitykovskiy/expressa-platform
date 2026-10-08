import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { computed, shallowRef } from "vue";
import { createNavigationItems } from "../../../src/app/navigation";
import SideNav from "../../../src/widgets/admin-shell/SideNav.vue";

const meta = {
  title: "Компоненты/Навигация/Боковое меню",
  id: "navigation-sidenav",
  component: SideNav,
  globals: { viewport: "desktop" },
  args: {
    role: "administrator",
    activeSection: "orders",
    sections: createNavigationItems("administrator").map(
      ({ section, label }) => ({ id: section, label }),
    ),
  },
  parameters: { layout: "fullscreen" },
  render: (args) => ({
    components: { SideNav },
    setup() {
      const activeSection = shallowRef(args.activeSection);
      const sections = computed(() =>
        createNavigationItems(args.role).map(({ section, label }) => ({
          id: section,
          label,
        })),
      );
      return { args, sections, activeSection };
    },
    template:
      '<SideNav v-bind="args" :sections="sections" :active-section="activeSection" @select="activeSection = $event" />',
  }),
} satisfies Meta<typeof SideNav>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Administrator: Story = { name: "Администратор" };
export const Barista: Story = { name: "Бариста", args: { role: "barista" } };
export const AvailabilityActive: Story = {
  name: "Раздел доступности",
  args: { activeSection: "availability" },
};
