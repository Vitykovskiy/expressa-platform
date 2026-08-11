export interface UiToggleProps {
  disabled?: boolean;
  modelValue?: boolean | null;
}

export interface UiToggleEmits {
  "update:modelValue": [value: boolean | null];
}
