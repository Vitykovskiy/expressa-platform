import type { Meta, StoryObj } from "@storybook/vue3-vite";
import UserActionMenu from "../../../src/pages/admin/users/UserActionMenu.vue";
import { user } from "../../fixtures/catalog";

const meta = {
  title: "Data display/UserActionMenu",
  component: UserActionMenu,
  args: { user, availableActions: ["change_role", "block"] },
} satisfies Meta<typeof UserActionMenu>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Active: Story = {};
export const Blocked: Story = {
  args: { availableActions: ["change_role", "unblock"] },
};
