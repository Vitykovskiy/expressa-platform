import type { ConfirmDialogProps } from "./ConfirmDialog.types";

export const CONFIRM_DIALOG_DEFAULTS: Required<
  Pick<
    ConfirmDialogProps,
    "confirmVariant" | "requireInput" | "inputPlaceholder"
  >
> = {
  confirmVariant: "primary",
  requireInput: false,
  inputPlaceholder: "",
};
