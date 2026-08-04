import {
  type CanActivate,
  type ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { authCryptoPort } from '../application/auth-crypto.constants';
import type { AuthCrypto } from '../application/auth-crypto.types';
import type { AuthRepository, SessionWithUser } from '../application/auth-repository.types';
import { clockPort } from '../application/clock.constants';
import type { Clock } from '../application/clock.types';
import type { UserRole } from '../domain/auth.types';
import type { AuthenticatedRequest } from './current-auth.decorator.types';
import type { SessionGuardConfiguration } from './session.guard.types';
import { authRepositoryPort, sessionGuardConfigurationToken } from '../auth.constants';

@Injectable()
export class SessionGuard implements CanActivate {
  constructor(
    @Inject(authRepositoryPort) private readonly repository: AuthRepository,
    @Inject(authCryptoPort) private readonly crypto: AuthCrypto,
    @Inject(clockPort) private readonly clock: Clock,
    @Inject(sessionGuardConfigurationToken)
    private readonly configuration: SessionGuardConfiguration,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<unknown>();
    if (!isAuthenticatedRequest(request)) {
      throw new UnauthorizedException();
    }

    const token = parseBearerToken(request.headers.authorization);

    if (token === null) {
      throw new UnauthorizedException();
    }

    const now = this.clock.now();
    const claims = this.crypto.verifyAccessToken(token, {
      audience: this.configuration.accessTokenAudience,
      issuer: this.configuration.accessTokenIssuer,
      now,
    });
    if (claims === null) {
      throw new UnauthorizedException();
    }

    const sessionWithUser = await this.repository.findSessionWithUser(claims.sid, now);
    if (!isCurrentSession(sessionWithUser, claims.sid, claims.sub, now)) {
      throw new UnauthorizedException();
    }

    request.auth = {
      phoneE164: sessionWithUser.user.phoneE164,
      role: sessionWithUser.user.role,
      sessionId: sessionWithUser.session.id,
      userId: sessionWithUser.user.id,
    };

    return true;
  }
}

function isAuthenticatedRequest(value: unknown): value is AuthenticatedRequest {
  return (
    typeof value === 'object' &&
    value !== null &&
    'headers' in value &&
    typeof value.headers === 'object' &&
    value.headers !== null
  );
}

function isCurrentSession(
  value: SessionWithUser | null,
  sessionId: string,
  userId: string,
  now: Date,
): value is SessionWithUser {
  return (
    value !== null &&
    value.session.id === sessionId &&
    value.session.userId === userId &&
    value.session.revokedAt === null &&
    value.session.expiresAt instanceof Date &&
    value.session.expiresAt > now &&
    value.user.id === userId &&
    typeof value.user.phoneE164 === 'string' &&
    isUserRole(value.user.role)
  );
}

function isUserRole(value: unknown): value is UserRole {
  return value === 'customer' || value === 'barista' || value === 'administrator';
}

function parseBearerToken(value: unknown): string | null {
  return typeof value === 'string' && /^Bearer [^\s]+$/.test(value)
    ? value.slice('Bearer '.length)
    : null;
}
