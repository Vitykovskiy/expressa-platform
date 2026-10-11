export interface UiSwitchProps {
  modelValue: boolean;
  label: string;
  pending?: boolean;
  disabled?: boolean;
}
export interface UiSwitchEmits {
  "update:modelValue": [value: boolean];
}
