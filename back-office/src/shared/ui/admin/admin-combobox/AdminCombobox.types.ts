export interface AdminComboboxOption {
  id: string;
  label: string;
}

export interface AdminComboboxProps {
  disabled?: boolean;
  loading?: boolean;
  modelValue: string;
  options: readonly AdminComboboxOption[];
}

export interface AdminComboboxEmits {
  "update:modelValue": [value: string];
}
