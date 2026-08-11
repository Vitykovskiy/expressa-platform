import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { shallowRef } from "vue";

import { createUserFixtures } from "../fixtures";
import type {
  AddUserData,
  ToggleUserBlockEvent,
  UpdateUserRoleEvent,
  User,
} from "../../../../src/shared/ui/admin/Admin.types";
import UsersScreen from "../../../../src/pages/admin/users/UsersScreen.vue";

const meta = {
  title: "Admin/Users/UsersScreen",
  component: UsersScreen,
  parameters: {
    layout: "fullscreen",
  },
  argTypes: {
    users: { table: { disable: true } },
    "onAdd-user": { action: "add-user" },
    "onUpdate-role": { action: "update-role" },
    "onToggle-block": { action: "toggle-block" },
  },
} satisfies Meta<typeof UsersScreen>;

export default meta;

type Story = StoryObj<{
  onAddUser: (data: AddUserData) => void;
  onUpdateRole: (event: UpdateUserRoleEvent) => void;
  onToggleBlock: (event: ToggleUserBlockEvent) => void;
}>;

function render(args: Story["args"]) {
  return {
    components: { UsersScreen },
    setup() {
      const users = shallowRef(createUserFixtures());

      function addUser(data: AddUserData) {
        const newUser: User = {
          id: `added-${users.value.length + 1}`,
          name: data.name,
          phone: data.phone,
          role: data.role,
          status: "active",
        };

        users.value = [...users.value, newUser];
        args?.onAddUser?.(data);
      }

      function updateRole(event: UpdateUserRoleEvent) {
        users.value = users.value.map((user) =>
          user.id === event.userId ? { ...user, role: event.role } : user,
        );
        args?.onUpdateRole?.(event);
      }

      function toggleBlock(event: ToggleUserBlockEvent) {
        users.value = users.value.map((user) =>
          user.id === event.userId
            ? {
                ...user,
                status: user.status === "blocked" ? "active" : "blocked",
              }
            : user,
        );
        args?.onToggleBlock?.(event);
      }

      return { users, addUser, updateRole, toggleBlock };
    },
    template: `
      <UsersScreen
        :users="users"
        @add-user="addUser"
        @toggle-block="toggleBlock"
        @update-role="updateRole"
      />
    `,
  };
}

export const Flow: Story = {
  args: {
    onAddUser: () => undefined,
    onUpdateRole: () => undefined,
    onToggleBlock: () => undefined,
  },
  render,
};

export const StableVisual: Story = {
  args: {
    onAddUser: () => undefined,
    onUpdateRole: () => undefined,
    onToggleBlock: () => undefined,
  },
  render,
};

export const AddUser: Story = {
  args: {
    onAddUser: () => undefined,
    onUpdateRole: () => undefined,
    onToggleBlock: () => undefined,
  },
  render,
};
