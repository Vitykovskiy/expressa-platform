export interface RequestOtpDto {
  readonly expiresInSeconds: number;
  readonly retryAfterSeconds: number;
}

export type OtpRequestOutcome =
  | { readonly kind: "sent"; readonly retryAfterSeconds: number }
  | { readonly kind: "rate-limited"; readonly retryAfterSeconds: number | null }
  | { readonly kind: "invalid-phone" }
  | { readonly kind: "unavailable" }
  | { readonly kind: "uncertain" }
  | { readonly kind: "cancelled" };

export type AuthStep = "phone" | "otp" | "invalid-code" | "expired" | "denied";

export interface AuthCardProps {
  readonly step: AuthStep;
  readonly phone: string;
  readonly code: string;
  readonly phoneInvalid: boolean;
  readonly canSend: boolean;
  readonly canConfirm: boolean;
}

export interface AuthCardEmits {
  phoneChanged: [value: string];
  codeChanged: [value: string];
  sendRequested: [];
  confirmRequested: [];
  changeNumberRequested: [];
  invalidPhoneSubmitted: [];
}
