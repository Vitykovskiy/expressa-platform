export interface OtpStepProps {
  phone: string;
  otp: string;
  error: string;
  valid: boolean;
}

export interface OtpStepEmits {
  "update:otp": [value: string];
  changePhone: [];
  submit: [];
}
