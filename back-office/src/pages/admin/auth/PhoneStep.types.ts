export interface PhoneStepProps {
  phone: string;
  error: string;
  valid: boolean;
}

export interface PhoneStepEmits {
  "update:phone": [value: string];
  submit: [];
}
