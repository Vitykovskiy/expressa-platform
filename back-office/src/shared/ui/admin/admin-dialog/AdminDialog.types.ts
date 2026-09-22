import type { AdminButtonVariant } from "../admin-button/AdminButton.types";

export interface AdminDialogProps {
  cancelLabel?: string;
  closeLabel?: string;
  dismissDisabled?: boolean;
  fullScreenBelow600?: boolean;
  modelValue?: boolean;
  maxWidth?: number | string;
  persistent?: boolean;
  pending?: boolean;
  submitDisabled?: boolean;
  submitForm?: string;
  submitLabel?: string;
  submitVariant?: AdminButtonVariant;
  title?: string;
}

export interface AdminDialogEmits {
  cancel: [];
  "update:modelValue": [value: boolean];
  afterEnter: [];
}
