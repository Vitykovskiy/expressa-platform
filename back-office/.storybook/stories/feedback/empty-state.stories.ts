import type { Meta, StoryObj } from "@storybook/vue3-vite";
import EmptyState from "../../../src/shared/ui/admin/empty-state/EmptyState.vue";
const meta = {
  title: "Feedback/EmptyState",
  component: EmptyState,
  args: {
    title: "Пользователей нет",
  },
} satisfies Meta<typeof EmptyState>;
export default meta;
export const Default: StoryObj<typeof meta> = {};
