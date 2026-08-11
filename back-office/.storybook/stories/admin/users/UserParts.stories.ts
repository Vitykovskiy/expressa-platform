import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { VApp } from "vuetify/components";

import type {
  User,
  UserAction,
} from "../../../../src/shared/ui/admin/Admin.types";
import UserActionMenu from "../../../../src/pages/admin/users/UserActionMenu.vue";
import UserRow from "../../../../src/pages/admin/users/UserRow.vue";

const activeAdministrator: User = {
  id: "1",
  name: "Анна Смирнова",
  phone: "+7 900 123-45-67",
  role: "administrator",
  status: "active",
};

const blockedBarista: User = {
  id: "5",
  name: "Виктория Белова",
  phone: "+7 944 567-89-01",
  role: "barista",
  status: "blocked",
};

const noRoleUser: User = {
  id: "4",
  name: "Роман Федоров",
  phone: "+7 933 456-78-90",
  role: null,
  status: "active",
};

const meta = {
  title: "Admin/Users/Parts",
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Части списка пользователей. UserRow получает user и emits action; UserActionMenu получает user, availableActions и emits select. Menu open state внутренний и не является control.",
      },
    },
  },
  argTypes: {
    user: { control: false, table: { disable: true } },
    availableActions: { control: false, table: { disable: true } },
    onAction: { action: "action" },
    onSelect: { action: "select" },
  },
} satisfies Meta;

export default meta;

type UserRowStory = StoryObj<{
  onAction: (action: UserAction) => void;
}>;

type UserActionMenuStory = StoryObj<{
  onSelect: (action: UserAction) => void;
}>;

function userRowRender(
  user: User,
  args: { onAction: (action: UserAction) => void },
) {
  return {
    components: { UserRow, VApp },
    setup() {
      return { args, user };
    },
    template: `
      <v-app>
        <user-row :user="user" @action="args.onAction" />
      </v-app>
    `,
  };
}

export const ActiveAdministrator: UserRowStory = {
  args: {
    onAction: () => undefined,
  },
  render: (args) => userRowRender(activeAdministrator, args),
};

export const BlockedBarista: UserRowStory = {
  args: {
    onAction: () => undefined,
  },
  render: (args) => userRowRender(blockedBarista, args),
};

export const WithoutRole: UserRowStory = {
  args: {
    onAction: () => undefined,
  },
  render: (args) => userRowRender(noRoleUser, args),
};

export const LongName: UserRowStory = {
  args: {
    onAction: () => undefined,
  },
  render: (args) =>
    userRowRender(
      {
        ...activeAdministrator,
        name: "Александра Константиновна Долгопрудненская",
      },
      args,
    ),
};

export const KeyboardSelect: UserActionMenuStory = {
  args: {
    onSelect: () => undefined,
  },
  render: (args) => ({
    components: { UserActionMenu, VApp },
    setup() {
      return { args, user: activeAdministrator };
    },
    template: `
      <v-app>
        <user-action-menu
          :available-actions="['change_role', 'block']"
          :user="user"
          @select="args.onSelect"
        />
      </v-app>
    `,
  }),
};

export const KeyboardEscape: UserActionMenuStory = {
  args: {
    onSelect: () => undefined,
  },
  render: (args) => ({
    components: { UserActionMenu, VApp },
    setup() {
      return { args, user: blockedBarista };
    },
    template: `
      <v-app>
        <user-action-menu
          :available-actions="['change_role', 'unblock']"
          :user="user"
          @select="args.onSelect"
        />
      </v-app>
    `,
  }),
};
