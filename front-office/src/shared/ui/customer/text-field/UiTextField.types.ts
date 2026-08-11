export interface UiTextFieldProps {
  modelValue?: string;
}

export interface UiTextFieldEmits {
  "update:modelValue": [value: string];
}
