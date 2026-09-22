import type { Meta, StoryObj } from "@storybook/vue3-vite";
import MenuProductRow from "../../../src/pages/admin/menu/MenuProductRow.vue";
import { product } from "../../fixtures/catalog";
const meta = {
  title: "Features/Menu/MenuProductRow",
  component: MenuProductRow,
  args: {
    product,
    canMoveUp: false,
    canMoveDown: true,
    disabled: false,
    showManagementActions: true,
  },
} satisfies Meta<typeof MenuProductRow>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Available: Story = {};
export const Unavailable: Story = {
  args: { product: { ...product, isAvailable: false } },
};
export const Disabled: Story = { args: { disabled: true } };
