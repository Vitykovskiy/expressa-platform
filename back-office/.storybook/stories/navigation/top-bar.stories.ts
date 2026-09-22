import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { Plus } from "lucide-vue-next";
import TopBar from "../../../src/widgets/admin-shell/TopBar.vue";

const meta = {
  title: "Navigation/TopBar",
  component: TopBar,
  args: { title: "Пользователи" },
  globals: { viewport: "mobile" },
  parameters: {
    layout: "padded",
  },
} satisfies Meta<typeof TopBar>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Title: Story = {};
export const Action: Story = {
  render: (args) => ({
    components: { Plus, TopBar },
    setup: () => ({ args }),
    template:
      '<TopBar v-bind="args"><template #action><Plus aria-hidden="true" color="currentColor" :size="20" /></template></TopBar>',
  }),
};
export const DisabledAction: Story = {
  args: { actionDisabled: true },
  render: Action.render,
};
