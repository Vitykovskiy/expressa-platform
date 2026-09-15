import type { UiDialogProps } from "./UiDialog.types";

export const UI_DIALOG_DEFAULTS = {
  modelValue: false,
} satisfies Required<Pick<UiDialogProps, "modelValue">>;

export const UI_DIALOG_OPEN_GUARD_MS = 300;
