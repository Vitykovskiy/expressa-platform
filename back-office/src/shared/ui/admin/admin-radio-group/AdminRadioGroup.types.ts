export interface AdminRadioOption {
  label: string;
  value: string;
}

export interface AdminRadioGroupProps {
  disabled?: boolean;
  items: readonly AdminRadioOption[];
  modelValue: string;
}

export interface AdminRadioGroupEmits {
  "update:modelValue": [value: string];
}
