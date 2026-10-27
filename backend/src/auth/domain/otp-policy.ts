import { ExpiredOtpCodeError, InvalidOtpCodeError } from "./auth.errors";
import type { OtpChallenge } from "./auth.types";
import { otpCodePattern, otpMaxAttempts } from "./otp-policy.constants";

export function isOtpCode(value: string): boolean {
  return otpCodePattern.test(value);
}

export function assertValidOtpCode(value: string): void {
  if (!isOtpCode(value)) {
    throw new InvalidOtpCodeError();
  }
}

export function assertOtpChallengeCanBeVerified(
  challenge: OtpChallenge,
  now: Date,
): void {
  if (now >= challenge.expiresAt) {
    throw new ExpiredOtpCodeError();
  }

  if (challenge.consumedAt !== null || challenge.attempts >= otpMaxAttempts) {
    throw new InvalidOtpCodeError();
  }
}
