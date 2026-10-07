import type { Meta, StoryObj } from "@storybook/vue3-vite";
import AdminActionGroup from "../../../src/shared/ui/admin/admin-action-group/AdminActionGroup.vue";
import AdminButton from "../../../src/shared/ui/admin/admin-button/AdminButton.vue";
const meta = {
  title: "Компоненты/Группа действий",
  id: "components-actiongroup",
  component: AdminActionGroup,
  parameters: { layout: "padded" },
} satisfies Meta<typeof AdminActionGroup>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Actions: Story = {
  name: "Действия",
  render: () => ({
    components: { AdminActionGroup, AdminButton },
    template:
      '<AdminActionGroup><AdminButton variant="secondary">Отмена</AdminButton><AdminButton>Сохранить</AdminButton></AdminActionGroup>',
  }),
};
