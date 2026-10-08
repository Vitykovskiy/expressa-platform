export interface AdminTextFieldProps {
  modelValue?: number | string;
  presentation?: "text" | "code";
}

export interface AdminTextFieldEmits {
  "update:modelValue": [value: string];
  input: [event: Event];
  change: [event: Event];
}
