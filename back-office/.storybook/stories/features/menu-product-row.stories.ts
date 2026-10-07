import type { Meta, StoryObj } from "@storybook/vue3-vite";
import MenuProductRow from "../../../src/pages/admin/menu/MenuProductRow.vue";
import { product } from "../../fixtures/catalog";
const meta = {
  title: "Бизнес компоненты/Меню/Строка товара",
  id: "features-menu-menuproductrow",
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
export const Available: Story = { name: "Доступно" };
export const Unavailable: Story = {
  name: "Недоступно",
  args: { product: { ...product, isAvailable: false } },
};
export const Disabled: Story = { name: "Недоступно", args: { disabled: true } };
