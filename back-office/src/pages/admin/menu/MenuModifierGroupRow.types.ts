import type { ModifierGroup } from "./catalog.types";
export interface MenuModifierGroupRowProps {
  group: ModifierGroup;
  disabled?: boolean;
}
export interface MenuModifierGroupRowEmits {
  edit: [group: ModifierGroup];
}
