import type { Meta, StoryObj } from "@storybook/vue3-vite";
import UsersScreen from "../../../src/pages/admin/users/UsersScreen.vue";
import { user } from "../../fixtures/catalog";
const meta = {
  title: "Features/Users/UsersScreen",
  component: UsersScreen,
  args: {
    users: [
      user,
      {
        ...user,
        id: "user-2",
        name: "Мария Соколова",
        role: null,
        status: "blocked",
      },
    ],
  },
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof UsersScreen>;
export default meta;
type Story = StoryObj<typeof meta>;
export const WithUsers: Story = {};
export const Empty: Story = { args: { users: [] } };
