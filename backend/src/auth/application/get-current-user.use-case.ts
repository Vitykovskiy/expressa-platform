import type { AuthCrypto } from "./auth-crypto.types";
import type { AuthRepository, AuthUser } from "./auth-repository.types";
import type { Clock } from "./clock.types";
import { AccessDeniedError } from "../domain/auth.errors";
import type { GetCurrentUserConfiguration } from "./get-current-user.use-case.types";

export class GetCurrentUserUseCase {
  constructor(
    private readonly repository: AuthRepository,
    private readonly crypto: AuthCrypto,
    private readonly clock: Clock,
    private readonly configuration: GetCurrentUserConfiguration,
  ) {}

  async execute(accessToken: string): Promise<AuthUser> {
    const now = this.clock.now();
    const claims = this.crypto.verifyAccessToken(accessToken, {
      audience: this.configuration.accessTokenAudience,
      issuer: this.configuration.accessTokenIssuer,
      now,
    });

    if (claims === null) {
      throw new AccessDeniedError();
    }

    const user = await this.repository.findCurrentUser(claims.sid, now);

    if (user === null || user.id !== claims.sub) {
      throw new AccessDeniedError();
    }

    return user;
  }
}
