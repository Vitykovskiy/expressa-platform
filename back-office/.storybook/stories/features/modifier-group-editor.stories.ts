import type { Meta, StoryObj } from "@storybook/vue3-vite";
import ModifierGroupEditor from "../../../src/pages/admin/menu/ModifierGroupEditor.vue";
import AdminDialog from "../../../src/shared/ui/admin/admin-dialog/AdminDialog.vue";
import ConfirmDialog from "../../../src/shared/ui/admin/confirm-dialog/ConfirmDialog.vue";
import { computed, shallowRef, watch } from "vue";
import { modifierGroup } from "../../fixtures/catalog";

const modifierGroupWithOptions = {
  ...modifierGroup,
  name: "Добавки",
  options: [
    {
      ...modifierGroup.options[0],
      id: "first",
      name: "Первый",
      sortOrder: 0,
    },
    {
      ...modifierGroup.options[0],
      id: "second",
      name: "Второй",
      sortOrder: 1,
    },
    {
      ...modifierGroup.options[0],
      id: "third",
      name: "Третий",
      sortOrder: 2,
    },
  ],
};
const meta = {
  title: "Бизнес компоненты/Меню/Редактор группы добавок",
  id: "features-menu-modifiergroupeditor",
  component: ModifierGroupEditor,
  args: { group: modifierGroup },
  parameters: { layout: "padded" },
} satisfies Meta<typeof ModifierGroupEditor>;
export default meta;
type Story = StoryObj<typeof meta>;
function createRender(args: Story["args"]) {
  return {
    components: { ModifierGroupEditor },
    setup: () => ({ args }),
    template: '<ModifierGroupEditor v-bind="args" />',
  };
}
export const Existing: Story = {
  name: "Существующая группа",
  args: { group: modifierGroupWithOptions },
  render: (args) => createRender(args),
};
export const New: Story = {
  name: "Новая группа",
  args: { group: null },
  render: (args) => createRender(args),
};
export const PendingLocked: Story = {
  name: "Ожидание без редактирования",
  args: { pendingMessage: "Сохраняем…", disabled: true },
  render: (args) => createRender(args),
};
export const Validation: Story = {
  name: "Ошибки ввода",
  args: {
    fieldErrors: {
      name: "Введите название группы",
      minSelect: "Минимум не может быть больше максимума",
      "options.0.name": "Введите название варианта",
    },
  },
  render: (args) => createRender(args),
};
function embeddedRender(args: Story["args"]) {
  return {
    components: { AdminDialog, ModifierGroupEditor, ConfirmDialog },
    setup() {
      const open = shallowRef(true);
      const archiveOpen = shallowRef(false);
      const submitDisabled = computed(
        () =>
          Boolean(args?.disabled) ||
          (args?.saveOutcome !== undefined &&
            args.saveOutcome !== "idle" &&
            (args.saveOutcome !== "rejected" ||
              args.operationKind === "archive")),
      );
      const archiveDisabled = computed(
        () =>
          Boolean(args?.disabled) ||
          (args?.saveOutcome !== undefined && args.saveOutcome !== "idle"),
      );
      watch(open, () => {
        archiveOpen.value = false;
      });
      return { args, open, archiveOpen, submitDisabled, archiveDisabled };
    },
    template: `<AdminDialog v-model="open" cancel-label="Отмена" max-width="800"
      :pending="args.disabled" :dismiss-disabled="args.disabled"
      :destructive-label="args.group !== null ? 'В архив' : undefined"
      :destructive-disabled="archiveDisabled" :submit-disabled="submitDisabled"
      @destructive="archiveOpen = true"
      submit-form="modifier-group-editor-form" submit-label="Сохранить" title="Группа добавок">
      <ModifierGroupEditor v-bind="args" embedded form-id="modifier-group-editor-form" />
    </AdminDialog>
    <ConfirmDialog v-model:open="archiveOpen" :pending="args.disabled"
      confirm-label="Архивировать" confirm-variant="destructive"
      description="Группа добавок больше не будет доступна для назначения."
      title="Архивировать группу добавок?" />`,
  };
}
export const Embedded: Story = {
  name: "В диалоге меню",
  args: { group: modifierGroupWithOptions },
  parameters: { layout: "fullscreen" },
  render: embeddedRender,
};
export const EmbeddedPending: Story = {
  name: "Диалог меню недоступен",
  args: {
    group: modifierGroupWithOptions,
    disabled: true,
    pendingMessage: "Сохраняем…",
  },
  parameters: { layout: "fullscreen" },
  render: embeddedRender,
};
export const EmbeddedNew: Story = {
  name: "Новая группа в диалоге",
  args: { group: null },
  parameters: { layout: "fullscreen" },
  render: embeddedRender,
};
export const EmbeddedUnconfirmed: Story = {
  name: "Неподтверждённое сохранение",
  args: {
    group: modifierGroupWithOptions,
    saveOutcome: "unconfirmed",
    operationKind: "save",
  },
  parameters: { layout: "fullscreen" },
  render: embeddedRender,
};
export const EmbeddedChecked: Story = {
  name: "После проверки меню",
  args: {
    group: modifierGroupWithOptions,
    saveOutcome: "checked",
    operationKind: "save",
  },
  parameters: { layout: "fullscreen" },
  render: embeddedRender,
};
export const EmbeddedArchiveRejected: Story = {
  name: "Архивирование отклонено",
  args: {
    group: modifierGroupWithOptions,
    saveOutcome: "rejected",
    operationKind: "archive",
  },
  parameters: { layout: "fullscreen" },
  render: embeddedRender,
};
