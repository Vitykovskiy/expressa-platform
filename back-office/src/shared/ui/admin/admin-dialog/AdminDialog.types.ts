export interface AdminDialogProps {
  fullScreenBelow600?: boolean;
  modelValue?: boolean;
  maxWidth?: number | string;
  persistent?: boolean;
}

export interface AdminDialogEmits {
  "update:modelValue": [value: boolean];
  afterEnter: [];
}
