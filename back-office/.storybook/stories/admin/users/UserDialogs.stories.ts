import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { shallowRef } from "vue";

import type {
  AddUserData,
  User,
  UserAction,
  UserRole,
} from "../../../../src/shared/ui/admin/Admin.types";
import AddUserDialog from "../../../../src/pages/admin/users/AddUserDialog.vue";
import UserActionDialog from "../../../../src/pages/admin/users/UserActionDialog.vue";

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
    onConfirm: () => undefined,
    onCancel: () => undefined,
  },
  render: (args) => actionDialogRender(args),
};

export const ChangeRoleVisual: UserActionDialogStory = {
  args: {
    action: "change_role",
    onConfirm: () => undefined,
    onCancel: () => undefined,
  },
  render: (args) => actionDialogRender(args),
};

export const BlockUser: UserActionDialogStory = {
  args: {
    action: "block",
    onConfirm: () => undefined,
    onCancel: () => undefined,
  },
  render: (args) => actionDialogRender(args),
};

export const BlockUserVisual: UserActionDialogStory = {
  args: {
    action: "block",
    onConfirm: () => undefined,
    onCancel: () => undefined,
  },
  render: (args) => actionDialogRender(args),
};

export const UnblockUser: UserActionDialogStory = {
  args: {
    action: "unblock",
    onConfirm: () => undefined,
    onCancel: () => undefined,
  },
  render: (args) => actionDialogRender(args),
};

export const UnblockUserVisual: UserActionDialogStory = {
  args: {
    action: "unblock",
    onConfirm: () => undefined,
    onCancel: () => undefined,
  },
  render: (args) => actionDialogRender(args),
};

export const AddUser: AddUserDialogStory = {
  args: {
    onAdd: () => undefined,
    onCancel: () => undefined,
  },
  render: (args) => addUserDialogRender(args),
};

export const AddUserVisual: AddUserDialogStory = {
  args: {
    onAdd: () => undefined,
    onCancel: () => undefined,
  },
  render: (args) => addUserDialogRender(args),
};

export const CancelResetsAndReturnsFocus: AddUserDialogStory = {
  args: {
    onAdd: () => undefined,
    onCancel: () => undefined,
  },
  render: (args) => addUserDialogRender(args, false),
};

export const KeyboardFocusTrapAndEscape: UserActionDialogStory = {
  args: {
    action: "change_role",
    onConfirm: () => undefined,
    onCancel: () => undefined,
  },
  render: (args) => actionDialogRender(args, false),
};
