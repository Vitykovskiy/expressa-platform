export const otpCodeLength = 6;
export const otpLifetimeMs = 5 * 60 * 1_000;
export const otpResendIntervalMs = 60 * 1_000;
export const otpMaxAttempts = 5;
export const otpCodePattern = /^\d{6}$/;
