export interface AdminTextareaProps {
  modelValue?: string;
}

export interface AdminTextareaEmits {
  change: [event: Event];
  input: [event: InputEvent];
  "update:modelValue": [value: string];
}
