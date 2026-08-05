import type { ModifierSelectionTypeOption } from "./ModifierGroupEditor.types";
import type { ModifierOptionDraft } from "./ModifierOptionEditor.types";

export const MODIFIER_SELECTION_TYPE_OPTIONS: readonly ModifierSelectionTypeOption[] =
  [
    { value: "single", label: "Один вариант" },
    { value: "multiple", label: "Несколько вариантов" },
  ];

export const MODIFIER_GROUP_EDITOR_DEFAULTS = {
  disabled: false,
  loading: false,
  errorMessage: "",
  fieldErrors: () => ({}),
};

export function createEmptyModifierOptionDraft(): ModifierOptionDraft {
  return {
    name: "",
    priceDeltaMinor: "0",
    isDefault: false,
    isAvailable: true,
  };
}
