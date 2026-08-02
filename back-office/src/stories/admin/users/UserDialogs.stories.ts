import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { expect, fn, userEvent, waitFor, within } from "storybook/test";
import { shallowRef } from "vue";

import type {
  AddUserData,
  User,
  UserAction,
  UserRole,
} from "../../../admin/shared/ui/Admin.types";
import AddUserDialog from "../../../admin/pages/users/AddUserDialog.vue";
import UserActionDialog from "../../../admin/pages/users/UserActionDialog.vue";

const activeUser: User = {
  id: "1",
  name: "Анна Смирнова",
  phone: "+7 900 123-45-67",
  role: "administrator",
  status: "active",
};

const meta = {
  title: "Admin/Users/Dialogs",
  parameters: {
    layout: "centered",
  },
  argTypes: {
    action: { control: "select", options: ["change_role", "block", "unblock"] },
    user: { table: { disable: true } },
    open: { table: { disable: true } },
    onConfirm: { action: "confirm" },
    onAdd: { action: "add" },
    onCancel: { action: "cancel" },
  },
} satisfies Meta;

export default meta;

type UserActionDialogStory = StoryObj<{
  action: UserAction;
  onConfirm: (role: UserRole | undefined) => void;
  onCancel: () => void;
}>;

type AddUserDialogStory = StoryObj<{
  onAdd: (data: AddUserData) => void;
  onCancel: () => void;
}>;

function dialogCanvas(canvasElement: HTMLElement) {
  return within(canvasElement.ownerDocument.body);
}

function storyUser() {
  return userEvent.setup({ pointerEventsCheck: 0 });
}

function actionDialogRender(
  args: UserActionDialogStory["args"],
  initiallyOpen = true,
) {
  return {
    components: { UserActionDialog },
    setup() {
      const open = shallowRef(initiallyOpen);
      return { args, open, user: activeUser };
    },
    template: `
      <button type="button" @click="open = true">Открыть диалог</button>
      <UserActionDialog
        v-bind="args"
        :user="user"
        v-model:open="open"
      />
    `,
  };
}

function addUserDialogRender(
  args: AddUserDialogStory["args"],
  initiallyOpen = true,
) {
  return {
    components: { AddUserDialog },
    setup() {
      const open = shallowRef(initiallyOpen);
      return { args, open };
    },
    template: `
      <button type="button" @click="open = true">Открыть диалог</button>
      <AddUserDialog v-bind="args" v-model:open="open" />
    `,
  };
}

export const ChangeRole: UserActionDialogStory = {
  args: {
    action: "change_role",
    onConfirm: fn<(role: UserRole | undefined) => void>(),
    onCancel: fn(),
  },
  render: (args) => actionDialogRender(args),
  play: async ({ args, canvasElement }) => {
    const canvas = dialogCanvas(canvasElement);
    const dialog = canvas.getByRole("dialog");
    const user = storyUser();

    await expect(dialog).toHaveAccessibleName("Изменить роль");
    await user.click(canvas.getByRole("radio", { name: /Администратор/ }));
    await user.click(canvas.getByRole("button", { name: "Назначить" }));

    await expect(args.onConfirm).toHaveBeenCalledWith("administrator");
  },
};

export const BlockUser: UserActionDialogStory = {
  args: {
    action: "block",
    onConfirm: fn<(role: UserRole | undefined) => void>(),
    onCancel: fn(),
  },
  render: (args) => actionDialogRender(args),
  play: async ({ args, canvasElement }) => {
    const canvas = dialogCanvas(canvasElement);
    const user = storyUser();

    await waitFor(() =>
      expect(canvas.getByText(activeUser.name)).toBeVisible(),
    );
    await user.click(canvas.getByRole("button", { name: "Заблокировать" }));
    await expect(args.onConfirm).toHaveBeenCalledWith(undefined);
  },
};

export const UnblockUser: UserActionDialogStory = {
  args: {
    action: "unblock",
    onConfirm: fn<(role: UserRole | undefined) => void>(),
    onCancel: fn(),
  },
  render: (args) => actionDialogRender(args),
  play: async ({ args, canvasElement }) => {
    const canvas = dialogCanvas(canvasElement);
    const user = storyUser();

    await waitFor(() =>
      expect(canvas.getByText(activeUser.name)).toBeVisible(),
    );
    await user.click(canvas.getByRole("button", { name: "Разблокировать" }));
    await expect(args.onConfirm).toHaveBeenCalledWith(undefined);
  },
};

export const AddUser: AddUserDialogStory = {
  args: {
    onAdd: fn<(data: AddUserData) => void>(),
    onCancel: fn(),
  },
  render: (args) => addUserDialogRender(args),
  play: async ({ args, canvasElement }) => {
    const canvas = dialogCanvas(canvasElement);
    const addButton = canvas.getByRole("button", {
      name: "Добавить пользователя",
    });
    const user = storyUser();

    await expect(addButton).toBeDisabled();
    await user.type(
      canvas.getByRole("textbox", { name: "Имя" }),
      "Иван Петров",
    );
    await user.type(
      canvas.getByRole("textbox", { name: "Телефон" }),
      "79001234567",
    );
    await user.selectOptions(
      canvas.getByRole("combobox", { name: "Роль" }),
      "administrator",
    );
    await expect(addButton).toBeEnabled();
    await user.click(addButton);

    await expect(args.onAdd).toHaveBeenCalledWith({
      name: "Иван Петров",
      phone: "+7 900 123-45-67",
      role: "administrator",
    });
  },
};

export const CancelResetsAndReturnsFocus: AddUserDialogStory = {
  args: {
    onAdd: fn<(data: AddUserData) => void>(),
    onCancel: fn(),
  },
  render: (args) => addUserDialogRender(args, false),
  play: async ({ args, canvasElement }) => {
    const canvas = dialogCanvas(canvasElement);
    const reopenButton = within(canvasElement).getByRole("button", {
      name: "Открыть диалог",
    });
    const user = storyUser();

    await user.click(reopenButton);
    await user.type(canvas.getByRole("textbox", { name: "Имя" }), "Черновик");
    await user.click(canvas.getByRole("button", { name: "Отмена" }));

    await expect(args.onCancel).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(reopenButton).toHaveFocus());

    await user.click(reopenButton);
    await expect(canvas.getByRole("textbox", { name: "Имя" })).toHaveValue("");
  },
};

export const KeyboardFocusTrapAndEscape: UserActionDialogStory = {
  args: {
    action: "change_role",
    onConfirm: fn<(role: UserRole | undefined) => void>(),
    onCancel: fn(),
  },
  render: (args) => actionDialogRender(args, false),
  play: async ({ args, canvasElement }) => {
    const canvas = dialogCanvas(canvasElement);
    const reopenButton = within(canvasElement).getByRole("button", {
      name: "Открыть диалог",
    });
    const user = storyUser();

    await user.click(reopenButton);
    const dialog = canvas.getByRole("dialog");
    const cancelButton = canvas.getByRole("button", { name: "Отмена" });
    cancelButton.focus();
    await user.keyboard("{Tab}");
    await expect(
      dialog.contains(canvasElement.ownerDocument.activeElement),
    ).toBe(true);
    await user.keyboard("{Escape}");

    await expect(args.onCancel).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(reopenButton).toHaveFocus());
  },
};
