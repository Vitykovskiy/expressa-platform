import type {
  AdminButtonSize,
  AdminButtonVariant,
} from "../admin-button/AdminButton.types";

export interface AdminDialogProps {
  cancelLabel?: string;
  actionSize?: AdminButtonSize;
  closeLabel?: string;
  dismissDisabled?: boolean;
  destructiveLabel?: string;
  destructiveDisabled?: boolean;
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
  destructive: [];
  cancel: [];
  "update:modelValue": [value: boolean];
  afterEnter: [];
}
