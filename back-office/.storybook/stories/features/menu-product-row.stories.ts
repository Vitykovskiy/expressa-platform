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
export const Available: Story = { name: "Товар доступен" };
export const Unavailable: Story = {
  name: "Товар недоступен",
  args: { product: { ...product, isAvailable: false } },
};
export const Disabled: Story = {
  name: "Действия заблокированы",
  args: { disabled: true },
};
export const PriceChoices: Story = {
  name: "Длинные варианты цены и управление",
  args: {
    product: {
      ...product,
      price: null,
      priceChoices: [
        {
          id: "small",
          portionLabel: "Небольшая чашка · 250 мл",
          price: 190,
          sortOrder: 0,
          isAvailable: true,
        },
        {
          id: "large",
          portionLabel:
            "Большая чашка с дополнительной порцией эспрессо · 450 мл",
          price: 390,
          sortOrder: 1,
          isAvailable: true,
        },
      ],
    },
  },
};
