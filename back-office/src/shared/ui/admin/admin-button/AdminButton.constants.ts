import type { AdminButtonProps } from "./AdminButton.types";

export const ADMIN_BUTTON_DEFAULTS: Required<
  Pick<AdminButtonProps, "variant" | "disabled" | "type">
> = {
  variant: "primary",
  disabled: false,
  type: "button",
};
