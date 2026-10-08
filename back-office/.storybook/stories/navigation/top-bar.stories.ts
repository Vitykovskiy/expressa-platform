import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { Plus } from "lucide-vue-next";
import { navigationDefinitions } from "../../../src/app/navigation.constants";
import AdminIcon from "../../../src/shared/ui/admin/admin-icon/AdminIcon.vue";
import TopBar from "../../../src/widgets/admin-shell/TopBar.vue";

const meta = {
  title: "Компоненты/Навигация/Заголовок раздела",
  id: "navigation-topbar",
  component: TopBar,
  args: { title: navigationDefinitions.menu.label },
  globals: { viewport: "mobile" },
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof TopBar>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Title: Story = { name: "С заголовком" };
export const Action: Story = {
  name: "С действием",
  render: (args) => ({
    components: { AdminIcon, TopBar },
    setup: () => ({ args, Plus }),
    template:
      '<TopBar v-bind="args"><template #action><AdminIcon :icon="Plus" /></template></TopBar>',
  }),
};
export const DisabledAction: Story = {
  name: "Действие недоступно",
  args: { actionDisabled: true },
  render: Action.render,
};
