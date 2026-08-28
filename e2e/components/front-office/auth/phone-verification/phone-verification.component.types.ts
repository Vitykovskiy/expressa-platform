export enum PhoneVerificationStep {
  PHONE = "phone",
  OTP = "otp",
}

export enum PhoneVerificationError {
  INVALID_CODE = "invalid-code",
  EXPIRED_CODE = "expired-code",
  RESEND_COOLDOWN = "resend-cooldown",
}
