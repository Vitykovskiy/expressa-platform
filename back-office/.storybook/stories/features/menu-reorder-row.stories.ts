import type { Meta, StoryObj } from "@storybook/vue3-vite";
import MenuReorderRow from "../../../src/pages/admin/menu/MenuReorderRow.vue";
const meta = {
  title: "Features/Menu/MenuReorderRow",
  component: MenuReorderRow,
  args: {
    entityType: "category",
    id: "coffee",
    label: "Кофе",
    canMoveUp: false,
    canMoveDown: true,
    position: 1,
    total: 2,
  },
} satisfies Meta<typeof MenuReorderRow>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Category: Story = {};
export const ProductDisabled: Story = {
  args: { entityType: "product", disabled: true },
};
