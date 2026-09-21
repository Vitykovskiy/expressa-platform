import type { ModifierGroup } from "./catalog.types";
export interface MenuModifierGroupRowProps {
  group: ModifierGroup;
}
export interface MenuModifierGroupRowEmits {
  edit: [group: ModifierGroup];
}
