import type { Meta, StoryObj } from "@storybook/vue3-vite";
import {
  expect,
  fireEvent,
  fn,
  userEvent,
  waitFor,
  within,
} from "storybook/test";
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

function dialogCanvas(canvasElement: HTMLElement) {
  return within(canvasElement.ownerDocument.body);
}

export const Confirm: Story = {
  args: {
    open: true,
    title: "Выдать заказ",
    description: "Подтвердите, что заказ был выдан клиенту",
    confirmLabel: "Подтвердить",
    onConfirm: fn<(reason: string | undefined) => void>(),
    onCancel: fn(),
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
  play: async ({ args, canvasElement }) => {
    const canvas = dialogCanvas(canvasElement);

    const confirmButton = canvas.getByRole("button", { name: "Подтвердить" });
    await fireEvent.click(confirmButton);

    await expect(args.onConfirm).toHaveBeenCalledWith(undefined);
    await waitFor(() =>
      expect(canvas.queryByRole("dialog")).not.toBeInTheDocument(),
    );
  },
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
    onConfirm: fn<(reason: string | undefined) => void>(),
    onCancel: fn(),
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
  play: async ({ args, canvasElement }) => {
    const canvas = dialogCanvas(canvasElement);
    const confirmButton = canvas.getByRole("button", { name: "Отклонить" });

    await fireEvent.click(confirmButton);

    const reasonInput = canvas.getByRole("textbox", { name: "Причина" });
    const error = canvas.getByRole("alert");

    await expect(error).toHaveTextContent("Укажите причину");
    await expect(reasonInput).toHaveAttribute("aria-describedby", error.id);

    await fireEvent.input(reasonInput, {
      target: { value: "Клиент отменил заказ" },
    });
    await fireEvent.click(confirmButton);

    await expect(args.onConfirm).toHaveBeenCalledWith("Клиент отменил заказ");
  },
};

export const CancelResetsReason: Story = {
  args: {
    open: false,
    title: "Отклонить заказ",
    description: "Укажите причину отклонения заказа",
    confirmLabel: "Отклонить",
    requireInput: true,
    inputPlaceholder: "Причина отклонения",
    onConfirm: fn<(reason: string | undefined) => void>(),
    onCancel: fn(),
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
  play: async ({ args, canvasElement }) => {
    const canvas = dialogCanvas(canvasElement);
    const reopenButton = within(canvasElement).getByRole("button", {
      name: "Открыть диалог",
    });

    await userEvent.click(reopenButton);

    const reasonInput = canvas.getByRole("textbox", { name: "Причина" });

    await fireEvent.input(reasonInput, {
      target: { value: "Проверка сброса" },
    });
    await userEvent.keyboard("{Escape}");

    await expect(args.onCancel).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(reopenButton).toHaveFocus());

    await userEvent.click(reopenButton);

    await expect(canvas.getByRole("textbox", { name: "Причина" })).toHaveValue(
      "",
    );
  },
};
