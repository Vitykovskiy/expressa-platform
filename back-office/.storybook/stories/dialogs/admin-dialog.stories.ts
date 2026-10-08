import type { Meta, StoryObj } from "@storybook/vue3-vite";
import AdminDialog from "../../../src/shared/ui/admin/admin-dialog/AdminDialog.vue";
import AdminTextField from "../../../src/shared/ui/admin/admin-text-field/AdminTextField.vue";
import { dialogHost } from "../../fixtures/hosts";
const meta = {
  title: "Компоненты/Диалоги/Оболочка диалога",
  id: "dialogs-admindialog",
  component: AdminDialog,
  args: {
    cancelLabel: "Отмена",
    maxWidth: "480",
    submitForm: "admin-dialog-story-form",
    submitLabel: "Сохранить",
    title: "Диалог",
  },
} satisfies Meta<typeof AdminDialog>;
export default meta;
type Story = StoryObj<typeof meta>;
function render(args: Story["args"]) {
  return {
    components: { AdminDialog },
    setup: () => {
      const host = dialogHost();
      return { ...host, args };
    },
    template:
      '<AdminDialog v-bind="args" v-model="open"><form id="admin-dialog-story-form"><p>Содержимое</p></form></AdminDialog>',
  };
}
export const Default: Story = { name: "Обычное состояние", render };
export const Persistent: Story = {
  name: "Без закрытия по фону",
  args: { persistent: true },
  render,
};
export const FullscreenOnMobile: Story = {
  name: "Во весь экран на телефоне",
  args: { fullScreenBelow600: true },
  render,
};
export const Long: Story = {
  name: "Длинный текст",
  args: { title: "Длинный заголовок диалога для проверки переноса текста" },
  render,
};
export const DestructiveSecondary: Story = {
  name: "Архивация в общем подвале",
  args: { destructiveLabel: "Архивировать" },
  render,
};
export const Pending: Story = {
  name: "Действия заблокированы",
  args: { destructiveLabel: "Архивировать", pending: true },
  render,
};
export const UnbrokenTitle: Story = {
  name: "Заголовок без пробелов",
  args: {
    title: "ОченьДлинноеНазваниеКатегорииБезПробеловДляПроверкиГраницДиалога",
  },
  render,
};

export const DefaultActionSize: Story = {
  name: "Обычные размеры действий",
  args: { actionSize: "default", destructiveLabel: "Архивировать" },
  render,
};
export const LongActions: Story = {
  name: "Длинные действия удаления цены",
  args: {
    cancelLabel: "Продолжить редактирование",
    submitLabel: "Удалить цену",
    submitVariant: "destructive",
  },
  render,
};
export const SingleCancel: Story = {
  name: "Одно действие закрытия",
  args: { submitLabel: "" },
  render,
};
export const NoActions: Story = {
  name: "Без действий в подвале",
  args: { cancelLabel: "", submitLabel: "" },
  render,
};
export const LongBody: Story = {
  name: "Прокрутка до последнего поля",
  args: { destructiveLabel: "Архивировать" },
  render: (args) => ({
    components: { AdminDialog, AdminTextField },
    setup: () => ({ ...dialogHost(), args }),
    template: `<AdminDialog v-bind="args" v-model="open">
      <form id="admin-dialog-story-form" @submit.prevent="open = false">
        <p v-for="index in 24" :key="index">Позиция {{ index }}</p>
        <label for="admin-dialog-story-last-field">Последнее поле</label>
        <AdminTextField id="admin-dialog-story-last-field" required />
      </form>
    </AdminDialog>`,
  }),
};
