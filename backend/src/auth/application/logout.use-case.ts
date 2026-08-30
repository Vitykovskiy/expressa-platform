import type { AuthCrypto } from "./auth-crypto.types";
import type { AuthRepository } from "./auth-repository.types";
import type { Clock } from "./clock.types";
import { AccessDeniedError } from "../domain/auth.errors";
import type { RefreshTokenParts } from "./logout.use-case.types";

export class LogoutUseCase {
  constructor(
    private readonly repository: AuthRepository,
    private readonly crypto: AuthCrypto,
    private readonly clock: Clock,
  ) {}

  async execute(refreshToken: string): Promise<void> {
    const parsedToken = parseRefreshToken(refreshToken);
    const refreshTokenHash = this.crypto.hashRefreshToken(refreshToken);

    if (refreshTokenHash === null) {
      throw new AccessDeniedError();
    }

    await this.repository.logoutSession(
      parsedToken.sessionId,
      refreshTokenHash,
      this.clock.now(),
    );
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
