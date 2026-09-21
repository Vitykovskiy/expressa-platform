import type { AuthCrypto } from "./auth-crypto.types";
import type { AuthRepository } from "./auth-repository.types";
import type { Clock } from "./clock.types";
import { AccessDeniedError } from "../domain/auth.errors";
import type {
  LogoutPushSubscription,
  RefreshTokenParts,
} from "./logout.use-case.types";

export class LogoutUnavailableError extends Error {
  constructor() {
    super("Logout storage is unavailable.");
  }
}

export class LogoutUseCase {
  constructor(
    private readonly repository: AuthRepository,
    private readonly crypto: AuthCrypto,
    private readonly clock: Clock,
  ) {}

  async execute(
    refreshToken: string,
    subscription: LogoutPushSubscription | null,
  ): Promise<void> {
    if (subscription === null) return this.logoutSession(refreshToken);

    const parsedCredential = tryParseRefreshToken(refreshToken);
    const refreshHash = this.crypto.hashRefreshToken(refreshToken);

    try {
      await this.repository.logoutSessionWithPushSubscription(
        parsedCredential?.sessionId ?? null,
        refreshHash,
        subscription,
        this.clock.now(),
      );
    } catch {
      throw new LogoutUnavailableError();
    }
  }

  private async logoutSession(refreshToken: string): Promise<void> {
    const parsedCredential = parseRefreshToken(refreshToken);
    const refreshHash = this.crypto.hashRefreshToken(refreshToken);

    if (refreshHash === null) throw new AccessDeniedError();

    try {
      await this.repository.logoutSession(
        parsedCredential.sessionId,
        refreshHash,
        this.clock.now(),
      );
    } catch {
      throw new LogoutUnavailableError();
    }
  }
}

function tryParseRefreshToken(value: string): RefreshTokenParts | null {
  try {
    return parseRefreshToken(value);
  } catch (error) {
    if (error instanceof AccessDeniedError) return null;
    throw error;
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
