import type { AdminRadioGroupProps } from "./AdminRadioGroup.types";

export const ADMIN_RADIO_GROUP_DEFAULTS: Required<
  Pick<AdminRadioGroupProps, "disabled">
> = {
  disabled: false,
};
