import {
  AccessDeniedError,
  ExpiredOtpCodeError,
  InvalidOtpCodeError,
} from "./auth.errors";
import type { OtpChallenge } from "./auth.types";
import {
  assertOtpChallengeCanBeVerified,
  assertRolePolicy,
  assertValidOtpCode,
} from "./otp-policy";
import { otpMaxAttempts } from "./otp-policy.constants";

const sentAt = new Date("2026-08-04T10:00:00.000Z");

function createChallenge(overrides: Partial<OtpChallenge> = {}): OtpChallenge {
  return {
    attempts: 0,
    consumedAt: null,
    expiresAt: new Date("2026-08-04T10:05:00.000Z"),
    sentAt,
    ...overrides,
  };
}

describe("OTP policy", () => {
  it.each(["000000", "123456", "999999"])(
    "принимает шестизначный код %s",
    (code) => {
      expect(() => assertValidOtpCode(code)).not.toThrow();
    },
  );

  it.each(["12345", "1234567", "12 3456", "abcdef"])(
    "отклоняет код не из шести цифр %s",
    (code) => {
      expect(() => assertValidOtpCode(code)).toThrow(InvalidOtpCodeError);
    },
  );

  it("принимает challenge до истечения срока и пятой попытки", () => {
    expect(() =>
      assertOtpChallengeCanBeVerified(
        createChallenge({ attempts: otpMaxAttempts - 1 }),
        new Date("2026-08-04T10:04:59.999Z"),
      ),
    ).not.toThrow();
  });

  it("отклоняет challenge на точной границе срока действия", () => {
    expect(() =>
      assertOtpChallengeCanBeVerified(
        createChallenge(),
        new Date("2026-08-04T10:05:00.000Z"),
      ),
    ).toThrow(ExpiredOtpCodeError);
  });

  it.each([
    createChallenge({ consumedAt: new Date("2026-08-04T10:01:00.000Z") }),
    createChallenge({ attempts: otpMaxAttempts }),
  ])("отклоняет использованный challenge или шестую попытку", (challenge) => {
    expect(() =>
      assertOtpChallengeCanBeVerified(
        challenge,
        new Date("2026-08-04T10:01:00.000Z"),
      ),
    ).toThrow(InvalidOtpCodeError);
  });

  it.each([
    ["customer", "Customer"],
    ["barista", "Staff"],
    ["administrator", "Staff"],
    ["administrator", "Administrator"],
  ] as const)("допускает роль %s по политике %s", (role, policy) => {
    expect(() => assertRolePolicy(role, policy)).not.toThrow();
  });

  it.each([
    ["customer", "Staff"],
    ["customer", "Administrator"],
    ["barista", "Administrator"],
  ] as const)("отклоняет роль %s по политике %s", (role, policy) => {
    expect(() => assertRolePolicy(role, policy)).toThrow(AccessDeniedError);
  });
});
