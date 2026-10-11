export interface UiCheckboxProps {
  modelValue: boolean;
  label: string;
  disabled?: boolean;
}
export interface UiCheckboxEmits {
  "update:modelValue": [value: boolean];
}
