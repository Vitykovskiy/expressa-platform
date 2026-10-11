export interface UiFilterOption {
  value: string;
  label: string;
}
export interface UiFilterGroupProps {
  modelValue: string;
  label: string;
  options: readonly UiFilterOption[];
  disabled?: boolean;
}
export interface UiFilterGroupEmits {
  "update:modelValue": [value: string];
}
