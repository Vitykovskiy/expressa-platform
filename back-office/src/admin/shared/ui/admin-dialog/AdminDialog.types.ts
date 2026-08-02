export interface AdminDialogProps {
  modelValue?: boolean;
  maxWidth?: number | string;
}

export interface AdminDialogEmits {
  "update:modelValue": [value: boolean];
  afterEnter: [];
}
