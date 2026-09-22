import type { AdminDialogProps } from "./AdminDialog.types";

export const ADMIN_DIALOG_MOBILE_MEDIA_QUERY = "(max-width: 767px)";

export const ADMIN_DIALOG_DEFAULTS = {
  cancelLabel: "",
  closeLabel: "Закрыть диалог",
  dismissDisabled: false,
  modelValue: false,
  pending: false,
  submitDisabled: false,
  submitPendingLabel: "Сохраняем…",
  submitVariant: "primary" as const,
} satisfies Required<
  Pick<
    AdminDialogProps,
    | "cancelLabel"
    | "closeLabel"
    | "dismissDisabled"
    | "modelValue"
    | "pending"
    | "submitDisabled"
    | "submitPendingLabel"
    | "submitVariant"
  >
>;
