export interface AdminTextFieldProps {
  modelValue?: number | string;
}

export interface AdminTextFieldEmits {
  "update:modelValue": [value: string];
  input: [event: Event];
  change: [event: Event];
}
