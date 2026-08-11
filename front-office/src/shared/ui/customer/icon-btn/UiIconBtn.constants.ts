import type { UiIconBtnProps } from "./UiIconBtn.types";

export const UI_ICON_BTN_DEFAULTS = {
  disabled: false,
  loading: false,
  type: "button",
} satisfies Required<Pick<UiIconBtnProps, "disabled" | "loading" | "type">>;
