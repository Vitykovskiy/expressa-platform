import type { AccessTokenClaims, AuthCrypto } from './auth-crypto.types';
import type { AuthRepository, AuthUser } from './auth-repository.types';
import type { Clock } from './clock.types';
import { AccessDeniedError } from '../domain/auth.errors';
import { GetCurrentUserUseCase } from './get-current-user.use-case';

const now = new Date('2026-08-04T10:00:00.000Z');
const claims: AccessTokenClaims = {
  aud: 'expressa-api',
  exp: 1_754_304_900,
  iat: 1_754_304_000,
  iss: 'expressa',
  sid: 'd2719b1e-6b2c-4c4e-8e61-5c5cc62e1952',
  sub: 'user-id',
};
const user: AuthUser = { id: 'user-id', phoneE164: '+79123456789', role: 'administrator' };

function createUseCase(currentUser: AuthUser | null, tokenClaims: AccessTokenClaims | null) {
  const repository = {
    findCurrentUser: jest.fn().mockResolvedValue(currentUser),
  } as unknown as jest.Mocked<AuthRepository>;
  const crypto = {
    verifyAccessToken: jest.fn().mockReturnValue(tokenClaims),
  } as unknown as jest.Mocked<AuthCrypto>;
  const clock = { now: jest.fn().mockReturnValue(now) } as jest.Mocked<Clock>;

  return {
    crypto,
    repository,
    useCase: new GetCurrentUserUseCase(repository, crypto, clock, {
      accessTokenAudience: 'expressa-api',
      accessTokenIssuer: 'expressa',
    }),
  };
}

describe('GetCurrentUserUseCase', () => {
  it('возвращает актуальную роль пользователя из активной сессии', async () => {
    const { useCase, repository } = createUseCase(user, claims);

    await expect(useCase.execute('access-token')).resolves.toEqual(user);
    expect(repository.findCurrentUser).toHaveBeenCalledWith(claims.sid, now);
  });

  it('отклоняет недействительный access token без чтения пользователя', async () => {
    const { useCase, repository } = createUseCase(null, null);

    await expect(useCase.execute('invalid-token')).rejects.toThrow(AccessDeniedError);
    expect(repository.findCurrentUser).not.toHaveBeenCalled();
  });

  it('отклоняет отозванную сессию или несоответствие пользователя claims', async () => {
    const unavailable = createUseCase(null, claims);
    const mismatched = createUseCase({ ...user, id: 'other-user' }, claims);

    await expect(unavailable.useCase.execute('access-token')).rejects.toThrow(
      AccessDeniedError,
    );
    await expect(mismatched.useCase.execute('access-token')).rejects.toThrow(
      AccessDeniedError,
    );
  });
});
