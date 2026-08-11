import type { AdminDialogProps } from "./AdminDialog.types";

export const ADMIN_DIALOG_MOBILE_MEDIA_QUERY = "(max-width: 767px)";

export const ADMIN_DIALOG_DEFAULTS = {
  modelValue: false,
} satisfies Required<Pick<AdminDialogProps, "modelValue">>;
