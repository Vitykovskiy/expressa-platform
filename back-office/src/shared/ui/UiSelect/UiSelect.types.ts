export interface UiSelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}
export interface UiSelectProps {
  modelValue: string | null;
  label: string;
  options: readonly UiSelectOption[];
  disabled?: boolean;
  error?: string;
}
export interface UiSelectEmits {
  "update:modelValue": [value: string | null];
}
