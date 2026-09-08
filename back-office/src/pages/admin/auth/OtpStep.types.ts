export interface OtpStepProps {
  phone: string;
  otp: string;
  error: string;
  expiresInSeconds: number;
  resendRemainingSeconds: number;
  valid: boolean;
}

export interface OtpStepEmits {
  "update:otp": [value: string];
  changePhone: [];
  resend: [];
  submit: [];
}
