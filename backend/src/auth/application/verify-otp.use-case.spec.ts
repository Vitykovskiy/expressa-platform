import type { AuthCrypto } from './auth-crypto.types';
import type {
  AuthRepository,
  AuthSession,
  AuthUser,
  OtpAuthentication,
  StoredOtpChallenge,
} from './auth-repository.types';
import { SessionCreationUnavailableError, VerifyOtpUseCase } from './verify-otp.use-case';
import { InvalidOtpCodeError } from '../domain/auth.errors';
import { otpLifetimeMs } from '../domain/otp-policy.constants';

const now = new Date('2026-08-04T10:00:00.000Z');

function createChallenge(overrides: Partial<StoredOtpChallenge> = {}): StoredOtpChallenge {
  return {
    id: 'challenge-id',
    codeHash: 'code-hash',
    expiresAt: new Date('2026-08-04T10:05:00.000Z'),
    consumedAt: null,
    sentAt: now,
    attempts: 0,
    ...overrides,
  };
}

function createRepository(): jest.Mocked<AuthRepository> {
  return {
    findCurrentUser: jest.fn(),
    findOpenOtpChallenge: jest.fn(),
    findOrCreateCustomer: jest.fn(),
    findSessionByRefreshTokenHash: jest.fn(),
    findSessionWithUser: jest.fn(),
    invalidateOtpChallenge: jest.fn(),
    logoutSession: jest.fn(),
    revokeSession: jest.fn(),
    reserveOtpChallenge: jest.fn(),
    rotateSession: jest.fn(),
    verifyOtpAndCreateSession: jest.fn(),
  };
}

function createCrypto(): jest.Mocked<AuthCrypto> {
  return {
    createAccessToken: jest
      .fn<ReturnType<AuthCrypto['createAccessToken']>, Parameters<AuthCrypto['createAccessToken']>>()
      .mockReturnValue('access-token'),
    createOtpHash: jest
      .fn<ReturnType<AuthCrypto['createOtpHash']>, Parameters<AuthCrypto['createOtpHash']>>()
      .mockReturnValue('provided-hash'),
    generateRefreshSecret: jest.fn(() => 'refresh-secret'),
    generateSessionId: jest.fn(() => 'session-id'),
    hashRefreshToken: jest
      .fn<ReturnType<AuthCrypto['hashRefreshToken']>, Parameters<AuthCrypto['hashRefreshToken']>>()
      .mockReturnValue('refresh-hash'),
    verifyAccessToken: jest.fn(),
    verifyOtpHash: jest
      .fn<ReturnType<AuthCrypto['verifyOtpHash']>, Parameters<AuthCrypto['verifyOtpHash']>>()
      .mockReturnValue(true),
  };
}

function createAuthentication(): Extract<OtpAuthentication, { status: 'authenticated' }> {
  const user: AuthUser = { id: 'user-id', phoneE164: '+79991234567', role: 'customer' };
  const session: AuthSession = {
    id: 'session-id',
    userId: user.id,
    refreshTokenHash: 'refresh-hash',
    expiresAt: new Date('2026-09-03T10:00:00.000Z'),
    revokedAt: null,
    createdAt: now,
    rotatedAt: null,
  };

  return { status: 'authenticated', user, session };
}

describe('VerifyOtpUseCase', () => {
  it('проверяет OTP атомарно и выдаёт access/refresh token', async () => {
    const repository = createRepository();
    const challenge = createChallenge();
    repository.findOpenOtpChallenge.mockResolvedValue(challenge);
    repository.verifyOtpAndCreateSession.mockResolvedValue(createAuthentication());
    const crypto = createCrypto();
    const useCase = new VerifyOtpUseCase(repository, crypto, { now: () => now });

    await expect(useCase.execute('8 999 123-45-67', '123456')).resolves.toEqual({
      accessToken: 'access-token',
      refreshToken: 'session-id.refresh-secret',
      sessionExpiresAt: new Date('2026-09-03T10:00:00.000Z'),
    });
    expect(repository.verifyOtpAndCreateSession).toHaveBeenCalledWith(
      '+79991234567',
      'code-hash',
      now,
      'session-id',
      'refresh-hash',
      new Date('2026-09-03T10:00:00.000Z'),
    );
    expect(crypto.hashRefreshToken).toHaveBeenCalledWith('session-id.refresh-secret');
    expect(crypto.createAccessToken).toHaveBeenCalledWith({
      audience: 'expressa-api',
      issuer: 'expressa',
      now,
      sessionId: 'session-id',
      subject: 'user-id',
      ttlMs: 900_000,
    });
  });

  it('отклоняет неверную длину без обращения к repository', async () => {
    const repository = createRepository();
    const useCase = new VerifyOtpUseCase(repository, createCrypto(), { now: () => now });

    await expect(useCase.execute('+79991234567', '12345')).rejects.toBeInstanceOf(InvalidOtpCodeError);
    expect(repository.findOpenOtpChallenge).not.toHaveBeenCalled();
  });

  it('атомарно учитывает неверный код, включая пятую попытку', async () => {
    const repository = createRepository();
    const challenge = createChallenge({ attempts: 4 });
    repository.findOpenOtpChallenge.mockResolvedValue(challenge);
    repository.verifyOtpAndCreateSession.mockResolvedValue({
      status: 'invalid',
      challenge: { ...challenge, attempts: 5 },
    });
    const crypto = createCrypto();
    crypto.verifyOtpHash.mockReturnValue(false);
    const useCase = new VerifyOtpUseCase(repository, crypto, { now: () => now });

    await expect(useCase.execute('+79991234567', '654321')).rejects.toBeInstanceOf(InvalidOtpCodeError);
    expect(repository.verifyOtpAndCreateSession).toHaveBeenCalledWith(
      '+79991234567',
      'provided-hash',
      now,
      'session-id',
      'refresh-hash',
      expect.any(Date),
    );
  });

  it('отклоняет код старше пяти минут по внедрённым часам', async () => {
    const repository = createRepository();
    const expiredAt = new Date(now.getTime() - 1_000);
    const expired = createChallenge({
      expiresAt: expiredAt,
      sentAt: new Date(expiredAt.getTime() - otpLifetimeMs),
    });
    repository.findOpenOtpChallenge.mockResolvedValue(expired);
    repository.verifyOtpAndCreateSession.mockResolvedValue({
      status: 'unavailable',
      challenge: expired,
    });
    const useCase = new VerifyOtpUseCase(repository, createCrypto(), { now: () => now });

    await expect(useCase.execute('+79991234567', '123456')).rejects.toMatchObject({
      code: 'AUTH_CODE_EXPIRED',
    });
  });

  it('безопасно отклоняет коллизию session id', async () => {
    const repository = createRepository();
    repository.findOpenOtpChallenge.mockResolvedValue(createChallenge());
    repository.verifyOtpAndCreateSession.mockResolvedValue({ status: 'session_conflict' });
    const useCase = new VerifyOtpUseCase(repository, createCrypto(), { now: () => now });

    await expect(useCase.execute('+79991234567', '123456')).rejects.toEqual(
      new SessionCreationUnavailableError(),
    );
  });
});
