import { otpResendIntervalMs } from "../domain/otp-policy.constants";

export const refreshCookieName = "expressa_refresh";
export const refreshCookiePath = "/api/v2/auth";

export const authErrorResponses = {
  expiredOtp: {
    code: "AUTH_CODE_EXPIRED",
    details: null,
    message: "Verification code expired",
  },
  invalidOtp: {
    code: "AUTH_CODE_INVALID",
    details: null,
    message: "Invalid verification code",
  },
  rateLimited: {
    code: "AUTH_RATE_LIMITED",
    details: null,
    message: "Too many requests",
  },
  serviceUnavailable: {
    code: "SERVICE_UNAVAILABLE",
    details: null,
    message: "Service unavailable",
  },
  validation: {
    code: "VALIDATION_ERROR",
    details: null,
    message: "Bad request",
  },
} as const;

export const otpRetryAfterSeconds = String(otpResendIntervalMs / 1_000);
