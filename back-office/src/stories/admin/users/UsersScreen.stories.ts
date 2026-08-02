import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { expect, fn, userEvent, within } from "storybook/test";
import { shallowRef } from "vue";

import { createUserFixtures } from "../fixtures";
import type {
  AddUserData,
  ToggleUserBlockEvent,
  UpdateUserRoleEvent,
  User,
} from "../../../admin/shared/ui/Admin.types";
import UsersScreen from "../../../admin/pages/users/UsersScreen.vue";

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
    onAddUser: fn<(data: AddUserData) => void>(),
    onUpdateRole: fn<(event: UpdateUserRoleEvent) => void>(),
    onToggleBlock: fn<(event: ToggleUserBlockEvent) => void>(),
  },
  render,
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    const body = within(canvasElement.ownerDocument.body);
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    const search = canvas.getByRole("searchbox", {
      name: "Фильтр по имени или телефону",
    });

    await user.type(search, "Роман");
    await expect(canvas.getByText("Роман Федоров")).toBeVisible();
    await expect(canvas.queryByText("Анна Смирнова")).not.toBeInTheDocument();

    await user.clear(search);
    await user.click(canvas.getByRole("button", { name: "Нет доступа" }));
    await expect(canvas.getByText("Виктория Белова")).toBeVisible();
    await expect(canvas.queryByText("Анна Смирнова")).not.toBeInTheDocument();

    await user.click(canvas.getByRole("button", { name: "Все" }));
    await user.type(search, "Несуществующий пользователь");
    await expect(canvas.getByRole("status")).toHaveTextContent(
      "Пользователей нет",
    );
    await user.clear(search);

    const annaActions = canvas.getByRole("button", {
      name: "Действия для Анна Смирнова",
    });
    await user.click(annaActions);
    await user.click(
      await body.findByRole("menuitem", { name: "Изменить роль" }),
    );
    await user.click(body.getByRole("radio", { name: /Бариста/ }));
    await user.click(body.getByRole("button", { name: "Назначить" }));
    await expect(args.onUpdateRole).toHaveBeenCalledWith({
      userId: "1",
      role: "barista",
    });
    await expect(body.getByRole("status")).toHaveTextContent(
      "Роль изменена на «Бариста»",
    );

    await user.click(annaActions);
    await user.click(
      await body.findByRole("menuitem", { name: "Заблокировать" }),
    );
    await user.click(body.getByRole("button", { name: "Заблокировать" }));
    await expect(args.onToggleBlock).toHaveBeenCalledWith({ userId: "1" });
    await expect(body.getByRole("status")).toHaveTextContent(
      "«Анна Смирнова» заблокирован",
    );
  },
};

export const AddUser: Story = {
  args: {
    onAddUser: fn<(data: AddUserData) => void>(),
    onUpdateRole: fn<(event: UpdateUserRoleEvent) => void>(),
    onToggleBlock: fn<(event: ToggleUserBlockEvent) => void>(),
  },
  render,
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    const body = within(canvasElement.ownerDocument.body);
    const user = userEvent.setup({ pointerEventsCheck: 0 });

    await user.click(canvas.getByRole("button", { name: "Добавить" }));
    await user.type(body.getByRole("textbox", { name: "Имя" }), "Иван Петров");
    await user.type(
      body.getByRole("textbox", { name: "Телефон" }),
      "79001234567",
    );
    await user.selectOptions(
      body.getByRole("combobox", { name: "Роль" }),
      "administrator",
    );
    await user.click(
      body.getByRole("button", { name: "Добавить пользователя" }),
    );

    await expect(args.onAddUser).toHaveBeenCalledWith({
      name: "Иван Петров",
      phone: "+7 900 123-45-67",
      role: "administrator",
    });
    await expect(canvas.getByText("Иван Петров")).toBeVisible();
    await expect(body.getByRole("status")).toHaveTextContent(
      "«Иван Петров» добавлен",
    );
  },
};
