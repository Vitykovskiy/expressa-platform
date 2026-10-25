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
