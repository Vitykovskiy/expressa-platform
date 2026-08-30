import type { AuthCrypto } from "./auth-crypto.types";
import type { AuthRepository } from "./auth-repository.types";
import type { Clock } from "./clock.types";
import { AccessDeniedError } from "../domain/auth.errors";
import type {
  RefreshedSession,
  RefreshSessionConfiguration,
  RefreshTokenParts,
} from "./refresh-session.use-case.types";

export class RefreshSessionUseCase {
  constructor(
    private readonly repository: AuthRepository,
    private readonly crypto: AuthCrypto,
    private readonly clock: Clock,
    private readonly configuration: RefreshSessionConfiguration,
  ) {}

  async execute(refreshToken: string): Promise<RefreshedSession> {
    const parsedToken = parseRefreshToken(refreshToken);
    const expectedHash = this.crypto.hashRefreshToken(refreshToken);

    if (expectedHash === null) {
      throw new AccessDeniedError();
    }

    const nextSecret = this.crypto.generateRefreshSecret();
    const nextRefreshToken = `${parsedToken.sessionId}.${nextSecret}`;
    const nextHash = this.crypto.hashRefreshToken(nextRefreshToken);

    if (nextHash === null) {
      throw new AccessDeniedError();
    }

    const now = this.clock.now();
    const result = await this.repository.rotateSession(
      parsedToken.sessionId,
      expectedHash,
      nextHash,
      now,
    );

    if (result.status !== "rotated") {
      throw new AccessDeniedError();
    }

    return {
      accessToken: this.crypto.createAccessToken({
        audience: this.configuration.accessTokenAudience,
        issuer: this.configuration.accessTokenIssuer,
        now,
        sessionId: result.session.id,
        subject: result.user.id,
        ttlMs: this.configuration.accessTokenTtlMs,
      }),
      refreshToken: nextRefreshToken,
      sessionExpiresAt: result.session.expiresAt,
      user: result.user,
    };
  }
}

function parseRefreshToken(value: string): RefreshTokenParts {
  const parts = value.split(".");
  const [sessionId, secret] = parts;

  if (
    parts.length !== 2 ||
    sessionId === undefined ||
    secret === undefined ||
    !isUuid(sessionId) ||
    secret === ""
  ) {
    throw new AccessDeniedError();
  }

  return { sessionId, secret };
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}
