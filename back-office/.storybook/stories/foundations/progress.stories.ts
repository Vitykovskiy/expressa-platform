import type { Meta, StoryObj } from "@storybook/vue3-vite";
import AdminProgress from "../../../src/shared/ui/admin/admin-progress/AdminProgress.vue";

const meta = {
  title: "Базовые элементы/Индикатор загрузки",
  id: "foundations-progress",
  component: AdminProgress,
  parameters: { layout: "padded" },
} satisfies Meta<typeof AdminProgress>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Progress: Story = {
  name: "Загрузка",
  render: () => ({
    components: { AdminProgress },
    template: '<AdminProgress label="Сохраняем…" />',
  }),
};
