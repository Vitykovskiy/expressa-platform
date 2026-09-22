export interface AdminComboboxOption {
  id: string;
  label: string;
}

export interface AdminComboboxProps {
  disabled?: boolean;
  label?: string;
  loading?: boolean;
  modelValue: string;
  options: readonly AdminComboboxOption[];
}

export interface AdminComboboxEmits {
  "update:modelValue": [value: string];
}
