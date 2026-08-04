export type AuthScreenState =
  "phone" | "otp" | "loading" | "denied" | "success";

export type AuthScreenOtpMetadata = {
  expiresInSeconds: number;
  retryAfterSeconds: number;
};

export type AuthScreenPresentation = Record<
  AuthScreenState,
  { title?: string }
>;

export interface AuthScreenProps {
  error: string;
  otp: string;
  otpMetadata: AuthScreenOtpMetadata | null;
  otpValid: boolean;
  phone: string;
  phoneValid: boolean;
  state: AuthScreenState;
}

export interface AuthScreenEmits {
  changePhone: [];
  requestOtp: [];
  resendOtp: [];
  retry: [];
  "update:otp": [value: string];
  "update:phone": [value: string];
  verifyOtp: [];
}
