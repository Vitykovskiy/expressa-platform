import type { Meta, StoryObj } from "@storybook/vue3-vite";
import AdminButton from "../../../src/shared/ui/admin/admin-button/AdminButton.vue";
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
export const WithAction: StoryObj<typeof meta> = {
  name: "Действие восстановления",
  args: { title: "Ничего не найдено" },
  render: (args) => ({
    components: { EmptyState, AdminButton },
    setup: () => ({ args }),
    template: `<EmptyState v-bind="args"><template #action><AdminButton variant="secondary">Сбросить фильтры</AdminButton></template></EmptyState>`,
  }),
};
