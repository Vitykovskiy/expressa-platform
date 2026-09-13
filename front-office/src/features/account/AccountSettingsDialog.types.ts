export type AccountSettingsDialogProps = {
  accountId: string | null;
  accountLabel: string;
  authenticated: boolean;
  logoutError: string | null;
  logoutPending: boolean;
  modelValue: boolean;
  returnFocusTo: HTMLElement | null;
};

export type AccountSettingsDialogEmits = {
  "update:modelValue": [open: boolean];
  signIn: [];
  signOut: [];
};
