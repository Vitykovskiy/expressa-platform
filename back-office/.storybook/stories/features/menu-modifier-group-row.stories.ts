import type { Meta, StoryObj } from "@storybook/vue3-vite";
import MenuModifierGroupRow from "../../../src/pages/admin/menu/MenuModifierGroupRow.vue";
import { modifierGroup } from "../../fixtures/catalog";
const meta = {
  title: "Бизнес компоненты/Меню/Строка группы добавок",
  id: "features-menu-menumodifiergrouprow",
  component: MenuModifierGroupRow,
  args: { group: modifierGroup },
} satisfies Meta<typeof MenuModifierGroupRow>;
export default meta;
export const Default: StoryObj<typeof meta> = { name: "Обычное состояние" };
