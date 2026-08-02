import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { expect, userEvent, within } from "storybook/test";
import { shallowRef } from "vue";

import Dialog from "../../../components/domain-ui/Feedback/Dialog.vue";
import EmptyState from "../../../components/domain-ui/Feedback/EmptyState.vue";
import ErrorState from "../../../components/domain-ui/Feedback/ErrorState.vue";
import InlineError from "../../../components/domain-ui/Feedback/InlineError.vue";
import NotificationPermission from "../../../components/domain-ui/Feedback/NotificationPermission.vue";
import Skeleton from "../../../components/domain-ui/Feedback/Skeleton.vue";
import Snackbar from "../../../components/domain-ui/Feedback/Snackbar.vue";

const meta = { title: "Feedback/Catalog" } satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

export const Loading: Story = {
  parameters: { viewport: { defaultViewport: "mobile320" } },
  render: () => ({
    components: { Skeleton },
    template: `<Skeleton :lines="4" />`,
  }),
};
export const Empty: Story = {
  parameters: { viewport: { defaultViewport: "mobile390" } },
  render: () => ({
    components: { EmptyState },
    template: `<EmptyState title="Корзина пуста" description="Добавьте напиток из меню." action-label="Открыть меню" />`,
  }),
};
export const Error: Story = {
  render: () => ({
    components: { ErrorState, InlineError },
    template: `<ErrorState description="Не удалось загрузить меню." retry-label="Повторить" /><InlineError message="Проверьте подключение к интернету." />`,
  }),
};
export const NotificationAllowed: Story = {
  parameters: { viewport: { defaultViewport: "tablet768" } },
  render: () => ({
    components: { NotificationPermission },
    template: `<NotificationPermission permission="granted" />`,
  }),
};
export const NotificationDenied: Story = {
  render: () => ({
    components: { NotificationPermission },
    template: `<NotificationPermission permission="denied" />`,
  }),
};
export const SnackbarClose: Story = {
  render: () => ({
    components: { Snackbar },
    setup() {
      const open = shallowRef(true);
      return { open };
    },
    template: `<Snackbar :open="open" message="Заказ обновлён" @close="open = false" />`,
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(
      canvas.getByRole("button", { name: "Закрыть уведомление" }),
    );
    await expect(canvas.queryByRole("status")).toBeNull();
  },
};
export const DialogKeyboard: Story = {
  render: () => ({
    components: { Dialog },
    setup() {
      const open = shallowRef(false);
      return { open };
    },
    template: `<button type="button" @click="open = true">Открыть диалог</button><Dialog :open="open" title="Заменить корзину?" description="Текущая корзина будет заменена доступными позициями." confirm-label="Заменить" @close="open = false" />`,
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole("button", { name: "Открыть диалог" });
    await userEvent.click(trigger);
    await expect(canvas.getByRole("button", { name: "Отмена" })).toHaveFocus();
    await userEvent.keyboard("{Escape}");
    await expect(canvas.queryByRole("dialog")).toBeNull();
    await expect(trigger).toHaveFocus();

    await userEvent.click(trigger);
    await userEvent.click(canvas.getByRole("button", { name: "Отмена" }));
    await expect(canvas.queryByRole("dialog")).toBeNull();
    await expect(trigger).toHaveFocus();

    await userEvent.click(trigger);
    const dialog = canvas.getByRole("dialog");
    const backdrop = dialog.parentElement;
    if (!backdrop) throw new globalThis.Error("Не найдена подложка диалога");
    await userEvent.click(backdrop);
    await expect(canvas.queryByRole("dialog")).toBeNull();
    await expect(trigger).toHaveFocus();
  },
};
