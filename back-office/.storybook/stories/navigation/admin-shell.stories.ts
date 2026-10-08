import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { computed, shallowRef } from "vue";
import { createNavigationItems } from "../../../src/app/navigation";
import { navigationDefinitions } from "../../../src/app/navigation.constants";
import PageShell from "../../../src/pages/PageShell.vue";
import AdminShell from "../../../src/widgets/admin-shell/AdminShell.vue";

const meta = {
  title: "Компоненты/Навигация/Оболочка приложения",
  id: "layout-adminshell",
  component: AdminShell,
  globals: { viewport: "desktop" },
  args: {
    role: "administrator",
    activeSection: "orders",
    items: createNavigationItems("administrator"),
  },
  parameters: { layout: "fullscreen" },
  render: (args) => ({
    components: { AdminShell, PageShell },
    setup() {
      const activeSection = shallowRef(args.activeSection);
      const items = computed(() => createNavigationItems(args.role));
      const title = computed(
        () =>
          items.value.find((item) => item.section === activeSection.value)
            ?.label ?? navigationDefinitions.queue.label,
      );
      return { args, activeSection, items, title };
    },
    template:
      '<AdminShell v-bind="args" :items="items" :active-section="activeSection" @navigate="activeSection = $event"><PageShell :title="title" /></AdminShell>',
  }),
} satisfies Meta<typeof AdminShell>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Administrator: Story = { name: "Администратор" };
export const Barista: Story = {
  name: "Бариста",
  args: { role: "barista", items: createNavigationItems("barista") },
};
export const Mobile: Story = {
  name: "Мобильный вид",
  globals: { viewport: "mobile" },
};
