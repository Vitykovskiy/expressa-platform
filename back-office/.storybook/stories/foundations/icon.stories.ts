import type { Meta, StoryObj } from "@storybook/vue3-vite";
import AdminIcon from "../../../src/shared/ui/admin/admin-icon/AdminIcon.vue";
import { Circle } from "lucide-vue-next";
const meta = {
  title: "Базовые элементы/Иконка",
  id: "foundations-icon",
  component: AdminIcon,
  parameters: { layout: "padded" },
} satisfies Meta<typeof AdminIcon>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Icon: Story = {
  name: "Иконка",
  render: () => ({
    components: { AdminIcon },
    setup: () => ({ Circle }),
    template: '<AdminIcon :icon="Circle" />',
  }),
};
