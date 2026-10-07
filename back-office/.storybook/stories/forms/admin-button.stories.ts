import type { Meta, StoryObj } from "@storybook/vue3-vite";
import AdminButton from "../../../src/shared/ui/admin/admin-button/AdminButton.vue";
const meta = {
  title: "Базовые элементы/Кнопка",
  id: "forms-adminbutton",
  component: AdminButton,
  args: { variant: "primary", disabled: false, type: "button" },
  parameters: { layout: "padded" },
} satisfies Meta<typeof AdminButton>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Primary: Story = {
  name: "Основная",
  args: { variant: "primary" },
  render: (args) => ({
    components: { AdminButton },
    setup: () => ({ args }),
    template: '<AdminButton v-bind="args">Сохранить</AdminButton>',
  }),
};
export const Secondary: Story = {
  ...Primary,
  name: "Вторичная",
  args: { variant: "secondary" },
};
export const Destructive: Story = {
  ...Primary,
  name: "Удаление",
  args: { variant: "destructive" },
};
export const Ghost: Story = {
  ...Primary,
  name: "Без фона",
  args: { variant: "ghost" },
};
export const Disabled: Story = {
  ...Primary,
  name: "Недоступно",
  args: { disabled: true },
};
export const Pending: Story = {
  ...Primary,
  name: "Ожидание операции",
  args: { pending: true },
};
