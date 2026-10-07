import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { Plus } from "lucide-vue-next";
import TopBar from "../../../src/widgets/admin-shell/TopBar.vue";

const meta = {
  title: "Компоненты/Навигация/Заголовок раздела",
  id: "navigation-topbar",
  component: TopBar,
  args: { title: "Пользователи" },
  globals: { viewport: "mobile" },
  parameters: {
    layout: "padded",
  },
} satisfies Meta<typeof TopBar>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Title: Story = { name: "С заголовком" };
export const Action: Story = {
  name: "С действием",
  render: (args) => ({
    components: { Plus, TopBar },
    setup: () => ({ args }),
    template:
      '<TopBar v-bind="args"><template #action><Plus color="currentColor" :size="20" /></template></TopBar>',
  }),
};
export const DisabledAction: Story = {
  name: "Действие недоступно",
  args: { actionDisabled: true },
  render: Action.render,
};
