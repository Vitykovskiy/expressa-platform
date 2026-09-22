import type { Meta, StoryObj } from "@storybook/vue3-vite";
import MenuModifierGroupRow from "../../../src/pages/admin/menu/MenuModifierGroupRow.vue";
import { modifierGroup } from "../../fixtures/catalog";
const meta = {
  title: "Features/Menu/MenuModifierGroupRow",
  component: MenuModifierGroupRow,
  args: { group: modifierGroup },
} satisfies Meta<typeof MenuModifierGroupRow>;
export default meta;
export const Default: StoryObj<typeof meta> = {};
