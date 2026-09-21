import type { ConfirmDialogProps } from "./ConfirmDialog.types";

export const CONFIRM_DIALOG_DEFAULTS: Required<
  Pick<
    ConfirmDialogProps,
    | "cancelLabel"
    | "confirmVariant"
    | "error"
    | "inputPlaceholder"
    | "pending"
    | "requireInput"
  >
> = {
  confirmVariant: "primary",
  cancelLabel: "Отмена",
  requireInput: false,
  inputPlaceholder: "",
  pending: false,
  error: "",
};
