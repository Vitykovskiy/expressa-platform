import { UnauthorizedException, type ExecutionContext } from '@nestjs/common';
import type { AccessTokenClaims, AuthCrypto } from '../application/auth-crypto.types';
import type { AuthRepository, SessionWithUser } from '../application/auth-repository.types';
import type { Clock } from '../application/clock.types';
import type { AuthenticatedRequest } from './current-auth.decorator.types';
import { SessionGuard } from './session.guard';

const now = new Date('2026-08-04T10:00:00.000Z');
const claims: AccessTokenClaims = {
  aud: 'expressa-api', exp: 1_754_304_900, iat: 1_754_304_000,
  iss: 'expressa', sid: 'session-id', sub: 'user-id',
};
const sessionWithUser: SessionWithUser = {
  session: {
    createdAt: new Date('2026-08-04T09:00:00.000Z'), expiresAt: new Date('2026-08-04T11:00:00.000Z'),
    id: 'session-id', refreshTokenHash: 'hash', revokedAt: null, rotatedAt: null, userId: 'user-id',
  },
  user: { id: 'user-id', phoneE164: '+79990000000', role: 'customer' },
};

function createGuard(tokenClaims: AccessTokenClaims | null, session: SessionWithUser | null) {
  const repository = { findSessionWithUser: jest.fn().mockResolvedValue(session) } as unknown as jest.Mocked<AuthRepository>;
  const crypto = { verifyAccessToken: jest.fn().mockReturnValue(tokenClaims) } as unknown as jest.Mocked<AuthCrypto>;
  const clock = { now: jest.fn().mockReturnValue(now) } as jest.Mocked<Clock>;
  return { crypto, guard: new SessionGuard(repository, crypto, clock, { accessTokenAudience: 'expressa-api', accessTokenIssuer: 'expressa' }), repository };
}

function context(request: unknown): ExecutionContext {
  return { switchToHttp: () => ({ getRequest: () => request }) } as unknown as ExecutionContext;
}

describe('SessionGuard', () => {
  it.each([undefined, 'Bearer', 'bearer token', 'Bearer first second', ['Bearer token']])(
    'отклоняет malformed Authorization %p до обращения к application',
    async (authorization) => {
      const { guard, crypto, repository } = createGuard(claims, sessionWithUser);
      const request = { headers: { authorization } };

      await expect(guard.canActivate(context(request))).rejects.toThrow(UnauthorizedException);
      expect(crypto.verifyAccessToken).not.toHaveBeenCalled();
      expect(repository.findSessionWithUser).not.toHaveBeenCalled();
    },
  );

  it('проверяет token и active session, затем attaches текущую DB роль', async () => {
    const { guard, repository } = createGuard(claims, sessionWithUser);
    const request: AuthenticatedRequest = { headers: { authorization: 'Bearer token' } };

    await expect(guard.canActivate(context(request))).resolves.toBe(true);
    expect(repository.findSessionWithUser).toHaveBeenCalledWith('session-id', now);
    expect(request.auth).toEqual({ phoneE164: '+79990000000', role: 'customer', sessionId: 'session-id', userId: 'user-id' });
  });

  it('отклоняет invalid JWT, revoked session и изменённый DB user', async () => {
    const invalid = createGuard(null, sessionWithUser);
    const revoked = createGuard(claims, { ...sessionWithUser, session: { ...sessionWithUser.session, revokedAt: now } });
    const changedUser = createGuard(claims, { ...sessionWithUser, user: { ...sessionWithUser.user, id: 'other-user', role: 'administrator' } });

    await expect(invalid.guard.canActivate(context({ headers: { authorization: 'Bearer token' } }))).rejects.toThrow(UnauthorizedException);
    await expect(revoked.guard.canActivate(context({ headers: { authorization: 'Bearer token' } }))).rejects.toThrow(UnauthorizedException);
    await expect(changedUser.guard.canActivate(context({ headers: { authorization: 'Bearer token' } }))).rejects.toThrow(UnauthorizedException);
  });
});
