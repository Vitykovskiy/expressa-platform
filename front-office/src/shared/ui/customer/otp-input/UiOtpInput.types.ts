export interface UiOtpInputProps {
  modelValue?: string;
  label: string;
  loading?: boolean;
  disabled?: boolean;
  readonly?: boolean;
}
export interface UiOtpInputEmits {
  "update:modelValue": [value: string];
}
