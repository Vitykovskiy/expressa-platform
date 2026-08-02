import type { UiBtnProps } from "./UiBtn.types";

export const UI_BTN_DEFAULTS = {
  disabled: false,
  loading: false,
  type: "button",
} satisfies Required<Pick<UiBtnProps, "disabled" | "loading" | "type">>;
