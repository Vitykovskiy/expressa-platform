export interface UiTextFieldProps {
  modelValue: string;
  label: string;
  id?: string;
  name?: string;
  type?: "text" | "search" | "number";
  disabled?: boolean;
  readOnly?: boolean;
  error?: string;
  hint?: string;
}

export interface UiTextFieldEmits {
  "update:modelValue": [value: string];
}
