import type { UiToggleProps } from "./UiToggle.types";

export const UI_TOGGLE_DEFAULTS = {
  disabled: false,
  modelValue: false,
} satisfies Required<Pick<UiToggleProps, "disabled" | "modelValue">>;
