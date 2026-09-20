import type { TopBarProps } from "./TopBar.types";

export const TOP_BAR_DEFAULTS: Required<
  Pick<TopBarProps, "actionDisabled" | "actionLabel">
> = {
  actionDisabled: false,
  actionLabel: "Действие",
};
