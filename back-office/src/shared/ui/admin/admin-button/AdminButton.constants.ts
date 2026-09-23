import type { AdminButtonProps } from "./AdminButton.types";

export const ADMIN_BUTTON_DEFAULTS: Required<
  Pick<AdminButtonProps, "variant" | "disabled" | "pending" | "type" | "size">
> = {
  variant: "primary",
  disabled: false,
  pending: false,
  type: "button",
  size: "default",
};
