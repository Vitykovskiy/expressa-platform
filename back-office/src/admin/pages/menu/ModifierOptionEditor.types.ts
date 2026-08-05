import type { ModifierOption } from "./catalog.types";

export type ModifierOptionFormField =
  "name" | "priceDeltaMinor" | "isDefault" | "isAvailable";

export interface ModifierOptionDraft {
  id?: string;
  name: string;
  priceDeltaMinor: string;
  isDefault: boolean;
  isAvailable: boolean;
}

export interface ModifierOptionFormData {
  id?: string;
  name: string;
  priceDeltaMinor: number;
  sortOrder: number;
  isDefault: boolean;
  isAvailable: boolean;
}

export interface ModifierOptionEditorProps {
  modelValue: ModifierOptionDraft;
  disabled?: boolean;
  fieldErrors?: Partial<Record<ModifierOptionFormField, string>>;
  canMoveUp: boolean;
  canMoveDown: boolean;
  positionLabel: string;
}

export interface ModifierOptionEditorEmits {
  "update:modelValue": [value: ModifierOptionDraft];
  remove: [];
  moveUp: [];
  moveDown: [];
}

export function createModifierOptionDraft(
  option: ModifierOption,
): ModifierOptionDraft {
  return {
    id: option.id,
    name: option.name,
    priceDeltaMinor: String(option.priceDeltaMinor),
    isDefault: option.isDefault,
    isAvailable: option.isAvailable,
  };
}
