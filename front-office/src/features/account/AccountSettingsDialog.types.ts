import type { UiDialogProps } from "@/shared/ui/customer/dialog/UiDialog.types";

export type AccountSettingsDialogProps = {
  accountId: string | null;
  accountLabel: string;
  authenticated: boolean;
  logoutError: string | null;
  logoutPending: boolean;
  modelValue: boolean;
  returnFocusTo: UiDialogProps["returnFocusTo"];
};

export type AccountSettingsDialogEmits = {
  "update:modelValue": [open: boolean];
  feedback: [message: string];
  signIn: [];
  signOut: [];
};
