import type { UiBtnProps } from "./UiBtn.types";

export const UI_BTN_DEFAULTS = {
  disabled: false,
  loading: false,
  navigation: false,
  navigationDirection: "back",
  type: "button",
} satisfies Required<
  Pick<
    UiBtnProps,
    "disabled" | "loading" | "navigation" | "navigationDirection" | "type"
  >
>;
