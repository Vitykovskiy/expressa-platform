export interface UiPhoneInputProps {
  modelValue?: string;
  label: string;
  loading?: boolean;
  disabled?: boolean;
  readonly?: boolean;
}
export interface UiPhoneInputEmits {
  "update:modelValue": [value: string];
}
