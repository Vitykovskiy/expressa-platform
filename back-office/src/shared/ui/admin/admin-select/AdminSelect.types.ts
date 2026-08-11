export interface AdminSelectProps {
  modelValue?: number | string;
}

export interface AdminSelectEmits {
  "update:modelValue": [value: string];
  input: [event: Event];
  change: [event: Event];
}
