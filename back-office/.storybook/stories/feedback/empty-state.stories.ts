import type { Meta, StoryObj } from "@storybook/vue3-vite";
import EmptyState from "../../../src/shared/ui/admin/empty-state/EmptyState.vue";
const meta = {
  title: "Компоненты/Обратная связь/Пустое состояние",
  id: "feedback-emptystate",
  component: EmptyState,
  args: {
    title: "Заказов нет",
  },
} satisfies Meta<typeof EmptyState>;
export default meta;
export const Default: StoryObj<typeof meta> = { name: "Обычное состояние" };
