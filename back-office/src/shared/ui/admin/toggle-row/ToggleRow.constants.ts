import type { ToggleRowProps } from "./ToggleRow.types";

export const TOGGLE_ROW_DEFAULTS: Required<Pick<ToggleRowProps, "disabled">> &
  Pick<ToggleRowProps, "sublabel"> = {
  sublabel: undefined,
  disabled: false,
};
