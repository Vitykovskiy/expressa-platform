import type { Meta, StoryObj } from "@storybook/vue3-vite";

import AdminButton from "../../../../src/shared/ui/admin/admin-button/AdminButton.vue";
import StatusBadge from "../../../../src/shared/ui/admin/status-badge/StatusBadge.vue";

const meta = {
  title: "Admin/Shared/Display",
  component: AdminButton,
  parameters: {
    layout: "centered",
  },
  argTypes: {
    variant: {
      control: "select",
      options: ["primary", "secondary", "destructive", "ghost"],
    },
    disabled: { control: "boolean" },
    type: { control: "select", options: ["button", "submit", "reset"] },
    onClick: { action: "click" },
  },
} satisfies Meta<typeof AdminButton>;

export default meta;

type Story = StoryObj<typeof meta>;

export const ButtonDefault: Story = {
  render: (args) => ({
    components: { AdminButton },
    setup: () => ({ args }),
    template: '<AdminButton v-bind="args">Сохранить</AdminButton>',
  }),
  args: {
    onClick: () => undefined,
  },
};

export const ButtonDisabled: Story = {
  render: () => ({
    components: { AdminButton },
    template: "<AdminButton disabled>Сохранить</AdminButton>",
  }),
};

export const OrderStatuses: Story = {
  parameters: {
    layout: "fullscreen",
  },
  render: () => ({
    components: { StatusBadge },
    template: `
      <div
        data-testid="status-list"
        style="disони будут показаны здесь без обрезания важного описания."
        />
      </div>
    `,
  }),
};
