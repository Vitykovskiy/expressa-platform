export interface AdminSelectProps {
  modelValue?: number | string;
  items: readonly AdminSelectItem[];
  placeholder?: string;
}

export interface AdminSelectItem {
  title: string;
  value: string;
  disabled?: boolean;
}

export interface AdminSelectEmits {
  "update:modelValue": [value: string];
}
