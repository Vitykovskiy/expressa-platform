import type { AuthCrypto } from './auth-crypto.types';
import type {
  AuthRepository,
  OtpAuthentication,
  StoredOtpChallenge,
} from './auth-repository.types';
import type { Clock } from './clock.types';
import { InvalidOtpCodeError } from '../domain/auth.errors';
import { assertOtpChallengeCanBeVerified, assertValidOtpCode } from '../domain/otp-policy';
import { normalizeRussianPhone } from '../domain/phone';
import {
  accessTokenAudience,
  accessTokenIssuer,
  accessTokenLifetimeMs,
  sessionLifetimeMs,
} from './verify-otp.use-case.constants';
import type { VerifyOtpResult } from './verify-otp.use-case.types';

export class SessionCreationUnavailableError extends Error {
  constructor() {
    super('Session creation is unavailable.');
  }
}

export class VerifyOtpUseCase {
  constructor(
    private readonly repository: AuthRepository,
    private readonly crypto: AuthCrypto,
    private readonly clock: Clock,
  ) {}

  async execute(phone: string, code: string): Promise<VerifyOtpResult> {
    const phoneE164 = normalizeRussianPhone(phone);
    assertValidOtpCode(code);

    const now = this.clock.now();
    const challenge = await this.repository.findOpenOtpChallenge(phoneE164);
    if (challenge === null) {
      throw new InvalidOtpCodeError();
    }

    const codeHash = this.crypto.verifyOtpHash(
      challenge.id,
      phoneE164,
      code,
      challenge.codeHash,
    )
      ? challenge.codeHash
      : this.crypto.createOtpHash(challenge.id, phoneE164, code);
    const sessionId = this.crypto.generateSessionId();
    const refreshSecret = this.crypto.generateRefreshSecret();
    const refreshToken = sessionId + '.' + refreshSecret;
    const refreshTokenHash = this.crypto.hashRefreshToken(refreshToken);

    if (refreshTokenHash === null) {
      throw new Error('Could not hash refresh token.');
    }

    const authentication = await this.repository.verifyOtpAndCreateSession(
      phoneE164,
      codeHash,
      now,
      sessionId,
      refreshTokenHash,
      new Date(now.getTime() + sessionLifetimeMs),
    );

    return this.createResult(authentication, challenge, now, refreshToken);
  }

  private createResult(
    authentication: OtpAuthentication,
    initialChallenge: StoredOtpChallenge,
    now: Date,
    refreshToken: string,
  ): VerifyOtpResult {
    if (authentication.status === 'invalid') {
      throw new InvalidOtpCodeError();
    }

    if (authentication.status === 'unavailable') {
      this.throwUnavailableChallenge(authentication.challenge ?? initialChallenge, now);
    }

    if (authentication.status === 'session_conflict') {
      throw new SessionCreationUnavailableError();
    }

    return {
      accessToken: this.crypto.createAccessToken({
        audience: accessTokenAudience,
        issuer: accessTokenIssuer,
        now,
        sessionId: authentication.session.id,
        subject: authentication.user.id,
        ttlMs: accessTokenLifetimeMs,
      }),
      refreshToken,
      sessionExpiresAt: authentication.session.expiresAt,
    };
  }

  private throwUnavailableChallenge(challenge: StoredOtpChallenge, now: Date): never {
    assertOtpChallengeCanBeVerified(challenge, now);

    throw new InvalidOtpCodeError();
  }
}
