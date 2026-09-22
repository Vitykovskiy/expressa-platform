import type { AdminComboboxProps } from "./AdminCombobox.types";

export const ADMIN_COMBOBOX_DEFAULTS: Required<
  Pick<AdminComboboxProps, "disabled" | "loading">
> = {
  disabled: false,
  loading: false,
};
