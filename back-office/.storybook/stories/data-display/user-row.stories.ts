import type { Meta, StoryObj } from "@storybook/vue3-vite";
import UserRow from "../../../src/pages/admin/users/UserRow.vue";
import { user } from "../../fixtures/catalog";
const meta = {
  title: "Data display/UserRow",
  component: UserRow,
  args: { user },
  parameters: { layout: "padded" },
} satisfies Meta<typeof UserRow>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Barista: Story = {};
export const Administrator: Story = {
  args: { user: { ...user, role: "administrator" } },
};
export const NoRole: Story = { args: { user: { ...user, role: null } } };
export const Blocked: Story = {
  args: { user: { ...user, status: "blocked" } },
};
export const LongName: Story = {
  args: {
    user: {
      ...user,
      name: "Александра Константиновна Преображенская",
      role: "administrator",
    },
  },
};
export const LongUnbrokenName: Story = {
  args: {
    user: {
      ...user,
      name: "АлександраКонстантиновнаПреображенская",
      status: "blocked",
    },
  },
};
