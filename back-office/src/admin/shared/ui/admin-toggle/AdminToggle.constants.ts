import type { AdminToggleProps } from "./AdminToggle.types";

export const ADMIN_TOGGLE_DEFAULTS = {
  modelValue: false,
  disabled: false,
} satisfies Required<Pick<AdminToggleProps, "modelValue" | "disabled">>;
