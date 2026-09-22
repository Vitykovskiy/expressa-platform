import type { Meta, StoryObj } from "@storybook/vue3-vite";
import AdminButton from "../../../src/shared/ui/admin/admin-button/AdminButton.vue";
const meta = {
  title: "Forms/AdminButton",
  component: AdminButton,
  args: { variant: "primary", disabled: false, type: "button" },
  parameters: { layout: "padded" },
} satisfies Meta<typeof AdminButton>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Primary: Story = {
  args: { variant: "primary" },
  render: (args) => ({
    components: { AdminButton },
    setup: () => ({ args }),
    template: '<AdminButton v-bind="args">Сохранить</AdminButton>',
  }),
};
export const Secondary: Story = { ...Primary, args: { variant: "secondary" } };
export const Destructive: Story = {
  ...Primary,
  args: { variant: "destructive" },
};
export const Ghost: Story = { ...Primary, args: { variant: "ghost" } };
export const Disabled: Story = { ...Primary, args: { disabled: true } };
export const Pending: Story = { ...Primary, args: { pending: true } };
