import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { shallowRef } from "vue";

import ConfirmDialog from "../../../../src/shared/ui/admin/confirm-dialog/ConfirmDialog.vue";

const meta = {
  title: "Admin/Shared/Confirm dialog",
  component: ConfirmDialog,
  parameters: {
    layout: "centered",
  },
  argTypes: {
    open: { table: { disable: true } },
    title: { control: "text" },
    description: { control: "text" },
    confirmLabel: { control: "text" },
    confirmVariant: { control: "select", options: ["primary", "destructive"] },
    requireInput: { control: "boolean" },
    inputPlaceholder: { control: "text" },
    onConfirm: { action: "confirm" },
    onCancel: { action: "cancel" },
  },
} satisfies Meta<typeof ConfirmDialog>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Confirm: Story = {
  args: {
    open: true,
    title: "Выдать заказ",
    description: "Подтвердите, что заказ был выдан клиенту",
    confirmLabel: "Подтвердить",
    onConfirm: () => undefined,
    onCancel: () => undefined,
  },
  render: (args) => ({
    components: { ConfirmDialog },
    setup() {
      const open = shallowRef(true);
      const dialogArgs = {
        title: args.title,
        description: args.description,
        confirmLabel: args.confirmLabel,
        onConfirm: args.onConfirm,
        onCancel: args.onCancel,
      };

      return { dialogArgs, open };
    },
    template: '<ConfirmDialog v-bind="dialogArgs" v-model:open="open" />',
  }),
};

export const RequiredReason: Story = {
  args: {
    open: true,
    title: "Отклонить заказ",
    description: "Укажите причину отклонения заказа",
    confirmLabel: "Отклонить",
    confirmVariant: "destructive",
    requireInput: true,
    inputPlaceholder: "Причина отклонения",
    onConfirm: () => undefined,
    onCancel: () => undefined,
  },
  render: (args) => ({
    components: { ConfirmDialog },
    setup() {
      const open = shallowRef(true);
      const dialogArgs = {
        title: args.title,
        description: args.description,
        confirmLabel: args.confirmLabel,
        confirmVariant: args.confirmVariant,
        requireInput: args.requireInput,
        inputPlaceholder: args.inputPlaceholder,
        onConfirm: args.onConfirm,
        onCancel: args.onCancel,
      };

      return { dialogArgs, open };
    },
    template: '<ConfirmDialog v-bind="dialogArgs" v-model:open="open" />',
  }),
};

export const CancelResetsReason: Story = {
  args: {
    open: false,
    title: "Отклонить заказ",
    description: "Укажите причину отклонения заказа",
    confirmLabel: "Отклонить",
    requireInput: true,
    inputPlaceholder: "Причина отклонения",
    onConfirm: () => undefined,
    onCancel: () => undefined,
  },
  render: (args) => ({
    components: { ConfirmDialog },
    setup() {
      const open = shallowRef(false);
      const dialogArgs = {
        title: args.title,
        description: args.description,
        confirmLabel: args.confirmLabel,
        requireInput: args.requireInput,
        inputPlaceholder: args.inputPlaceholder,
        onConfirm: args.onConfirm,
        onCancel: args.onCancel,
      };

      return { dialogArgs, open };
    },
    template: `
      <button type="button" @click="open = true">Открыть диалог</button>
      <ConfirmDialog v-bind="dialogArgs" v-model:open="open" />
    `,
  }),
};
