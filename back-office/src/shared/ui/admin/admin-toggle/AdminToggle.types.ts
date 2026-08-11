export interface AdminToggleProps {
  modelValue?: boolean | null;
  disabled?: boolean;
}

export interface AdminToggleEmits {
  "update:modelValue": [value: boolean | null];
}
