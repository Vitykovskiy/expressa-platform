export interface OtpStepProps {
  phone: string;
  otp: string;
  error: string;
  expiresInSeconds: number;
  retryAfterSeconds: number;
  valid: boolean;
}

export interface OtpStepEmits {
  "update:otp": [value: string];
  changePhone: [];
  resend: [];
  submit: [];
}
