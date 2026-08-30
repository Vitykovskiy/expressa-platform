import { randomUUID } from "node:crypto";
import type { AuthCrypto } from "./auth-crypto.types";
import type { AuthRepository } from "./auth-repository.types";
import type { Clock } from "./clock.types";
import type { OtpCodeGenerator } from "./otp-code-generator.types";
import type { SmsSender } from "./sms-sender.types";
import { OtpRateLimitedError } from "../domain/auth.errors";
import {
  otpLifetimeMs,
  otpResendIntervalMs,
} from "../domain/otp-policy.constants";
import { normalizeRussianPhone } from "../domain/phone";
import type { RequestOtpResult } from "./request-otp.use-case.types";

export class OtpDeliveryUnavailableError extends Error {
  constructor() {
    super("OTP delivery is unavailable.");
  }
}

export class RequestOtpUseCase {
  constructor(
    private readonly repository: AuthRepository,
    private readonly codeGenerator: OtpCodeGenerator,
    private readonly crypto: AuthCrypto,
    private readonly smsSender: SmsSender,
    private readonly clock: Clock,
  ) {}

  async execute(phone: string): Promise<RequestOtpResult> {
    const phoneE164 = normalizeRussianPhone(phone);
    const now = this.clock.now();
    const challengeId = randomUUID();
    const code = this.codeGenerator.generate();
    const expiresAt = new Date(now.getTime() + otpLifetimeMs);
    const codeHash = this.crypto.createOtpHash(challengeId, phoneE164, code);
    const reservation = await this.repository.reserveOtpChallenge(
      phoneE164,
      codeHash,
      expiresAt,
      now,
      challengeId,
    );

    if (reservation.status === "rate_limited") {
      throw new OtpRateLimitedError();
    }

    try {
      await this.smsSender.send(phoneE164, code);
    } catch {
      try {
        await this.repository.invalidateOtpChallenge(
          challengeId,
          this.clock.now(),
        );
      } catch {
        // The public result must remain safe when compensating persistence fails.
      }

      throw new OtpDeliveryUnavailableError();
    }

    return {
      retryAfterSeconds: otpResendIntervalMs / 1_000,
      expiresInSeconds: otpLifetimeMs / 1_000,
    };
  }
}
