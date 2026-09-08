export interface AdminDialogProps {
  modelValue?: boolean;
  maxWidth?: number | string;
  persistent?: boolean;
}

export interface AdminDialogEmits {
  "update:modelValue": [value: boolean];
  afterEnter: [];
}
