import { PostgresAuthRepository } from '../../src/auth/adapters/postgres-auth.repository';
import { HttpException, HttpStatus } from '@nestjs/common';
import { UnifiedExceptionFilter } from '../../src/platform/observability/unified-exception.filter';

const now = new Date('2026-08-16T10:00:00.000Z');
const expiresAt = new Date('2026-08-16T11:00:00.000Z');

function otpRow(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    attempts: 0,
    code_hash: 'otp-hash',
    consumed_at: null,
    expires_at: expiresAt,
    id: 'challenge-id',
    sent_at: now,
    ...overrides,
  };
}

function userRow(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return { id: 'user-id', phone_e164: '+79991234567', role: 'customer', ...overrides };
}

function sessionRow(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    created_at: now,
    expires_at: expiresAt,
    id: 'session-id',
    refresh_token_hash: 'refresh-hash',
    revoked_at: null,
    rotated_at: null,
    user_id: 'user-id',
    ...overrides,
  };
}

function sessionWithUserRow(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    ...sessionRow(),
    current_user_id: 'user-id',
    current_user_phone_e164: '+79991234567',
    current_user_role: 'customer',
    ...overrides,
  };
}

function transactionRepository(rows: Record<string, unknown>[][]): {
  client: { query: jest.Mock; release: jest.Mock };
  repository: PostgresAuthRepository;
} {
  const client = {
    query: jest.fn().mockImplementation(async () => ({ rows: rows.shift() ?? [] })),
    release: jest.fn(),
  };
  const pool = { connect: jest.fn().mockResolvedValue(client), query: jest.fn() };

  return { client, repository: new PostgresAuthRepository(pool as never) };
}

describe('PostgresAuthRepository: OTP и сессии', () => {
  it('создаёт OTP только после advisory lock и возвращает созданную challenge', async () => {
    const { client, repository } = transactionRepository([[], [], [], [], [otpRow()], []]);

    await expect(
      repository.reserveOtpChallenge('+79991234567', 'otp-hash', expiresAt, now, 'challenge-id'),
    ).resolves.toEqual({
      challenge: {
        attempts: 0,
        codeHash: 'otp-hash',
        consumedAt: null,
        expiresAt,
        id: 'challenge-id',
        sentAt: now,
      },
      status: 'created',
    });
    expect(client.query.mock.calls.map(([sql]) => sql)).toEqual(
      expect.arrayContaining([
        'BEGIN',
        expect.stringContaining('pg_advisory_xact_lock'),
        expect.stringContaining('INSERT INTO otp_challenges'),
        'COMMIT',
      ]),
    );
    expect(client.release).toHaveBeenCalledTimes(1);
  });

  it('не перезаписывает OTP в cooldown', async () => {
    const { client, repository } = transactionRepository([[], [], [{ sent_at: now }], []]);

    await expect(
      repository.reserveOtpChallenge('+79991234567', 'otp-hash', expiresAt, now, 'challenge-id'),
    ).resolves.toEqual({ status: 'rate_limited' });
    expect(client.query.mock.calls.map(([sql]) => sql)).not.toContain(
      expect.stringContaining('INSERT INTO otp_challenges'),
    );
  });

  it('различает недоступный, неверный и подтверждённый OTP', async () => {
    const unavailable = transactionRepository([[], [], []]);
    await expect(
      unavailable.repository.verifyOtpAndCreateSession(
        '+79991234567', 'otp-hash', now, 'session-id', 'refresh-hash', expiresAt,
      ),
    ).resolves.toEqual({ challenge: null, status: 'unavailable' });

    const invalid = transactionRepository([[], [otpRow({ code_hash: 'different' })], [otpRow({ attempts: 1 })], []]);
    await expect(
      invalid.repository.verifyOtpAndCreateSession(
        '+79991234567', 'otp-hash', now, 'session-id', 'refresh-hash', expiresAt,
      ),
    ).resolves.toMatchObject({ status: 'invalid', challenge: { attempts: 1 } });

    const authenticated = transactionRepository([
      [], [otpRow()], [], [], [userRow()], [sessionRow()], [],
    ]);
    await expect(
      authenticated.repository.verifyOtpAndCreateSession(
        '+79991234567', 'otp-hash', now, 'session-id', 'refresh-hash', expiresAt,
      ),
    ).resolves.toMatchObject({
      status: 'authenticated',
      session: { id: 'session-id' },
      user: { id: 'user-id', role: 'customer' },
    });
  });

  it('отклоняет конфликт session id без утечки ошибки базы', async () => {
    const { repository } = transactionRepository([
      [], [otpRow()], [], [], [userRow()], [], [], [],
    ]);

    await expect(
      repository.verifyOtpAndCreateSession(
        '+79991234567', 'otp-hash', now, 'session-id', 'refresh-hash', expiresAt,
      ),
    ).resolves.toEqual({ status: 'session_conflict' });
  });

  it('атомарно rotates или отзывает сессию по текущему хешу', async () => {
    const unavailable = transactionRepository([[], [], []]);
    await expect(
      unavailable.repository.rotateSession('session-id', 'refresh-hash', 'next-hash', now),
    ).resolves.toEqual({ status: 'unavailable' });

    const mismatch = transactionRepository([
      [], [sessionWithUserRow()], [sessionRow({ revoked_at: now })], [],
    ]);
    await expect(
      mismatch.repository.rotateSession('session-id', 'wrong-hash', 'next-hash', now),
    ).resolves.toMatchObject({ status: 'mismatch', session: { revokedAt: now } });

    const rotated = transactionRepository([
      [], [sessionWithUserRow()], [sessionRow({ refresh_token_hash: 'next-hash', rotated_at: now })], [],
    ]);
    await expect(
      rotated.repository.rotateSession('session-id', 'refresh-hash', 'next-hash', now),
    ).resolves.toMatchObject({ status: 'rotated', session: { refreshTokenHash: 'next-hash' } });

    const logout = transactionRepository([
      [], [sessionRow()], [sessionRow({ revoked_at: now })], [],
    ]);
    await expect(
      logout.repository.logoutSession('session-id', 'refresh-hash', now),
    ).resolves.toMatchObject({ status: 'revoked', session: { revokedAt: now } });
  });

  it('не принимает неполные строки PostgreSQL как auth-состояние', async () => {
    const pool = { query: jest.fn().mockResolvedValue({ rows: [{ ...userRow(), role: 'owner' }] }) };
    const repository = new PostgresAuthRepository(pool as never);

    await expect(repository.findCurrentUser('session-id', now)).rejects.toThrow(
      'Invalid PostgreSQL row field: role',
    );
  });
});

describe('UnifiedExceptionFilter: platform error envelope', () => {
  function runFilter(
    exception: unknown,
    url: string,
    request: Record<string, unknown> = {},
  ): {
    reply: jest.Mock;
    log: jest.Mock;
    recordApiError: jest.Mock;
    recordOtpFailure: jest.Mock;
  } {
    const reply = jest.fn();
    const log = jest.fn();
    const recordApiError = jest.fn();
    const recordOtpFailure = jest.fn();
    const filter = new UnifiedExceptionFilter(
      { httpAdapter: { getRequestUrl: () => url, reply } } as never,
      { log } as never,
      { recordApiError, recordOtpFailure } as never,
    );

    filter.catch(exception, {
      switchToHttp: () => ({
        getRequest: () => request,
        getResponse: () => ({}),
      }),
    } as never);
    return { reply, log, recordApiError, recordOtpFailure };
  }

  it('returns the safe generic envelope for an unknown platform exception', () => {
    const result = runFilter(new Error('database secret'), '/api/v1/orders?token=secret');

    expect(result.reply).toHaveBeenCalledWith(
      {},
      {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Internal server error',
        details: null,
        requestId: 'unknown',
      },
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
    expect(result.recordApiError).toHaveBeenCalledTimes(1);
    expect(result.recordOtpFailure).not.toHaveBeenCalled();
    expect(JSON.stringify(result.reply.mock.calls[0][1])).not.toContain('database secret');
  });

  it('preserves a structured client envelope and records OTP failure', () => {
    const result = runFilter(
      new HttpException(
        { code: 'AUTH_CODE_INVALID', message: 'Invalid code', details: { attempts: 1 } },
        HttpStatus.UNAUTHORIZED,
      ),
      '/api/v1/auth/otp/request?phone=secret',
      { method: 'POST', requestId: 'request-id' },
    );

    expect(result.reply.mock.calls[0][1]).toEqual({
      code: 'AUTH_CODE_INVALID',
      message: 'Invalid code',
      details: { attempts: 1 },
      requestId: 'request-id',
    });
    expect(result.reply.mock.calls[0][2]).toBe(HttpStatus.UNAUTHORIZED);
    expect(result.recordOtpFailure).toHaveBeenCalledTimes(1);
    expect(result.log).toHaveBeenCalledWith({
      event: 'http_error',
      level: 'info',
      method: 'POST',
      path: '/api/v1/auth/otp/request',
      requestId: 'request-id',
      statusCode: HttpStatus.UNAUTHORIZED,
    });
  });

  it('sanitizes structured server errors and maps unstructured HTTP errors', () => {
    const server = runFilter(
      new HttpException(
        { code: 'DB_FAILURE', message: 'password=secret', details: { password: 'secret' } },
        HttpStatus.INTERNAL_SERVER_ERROR,
      ),
      '/health/ready',
      { method: 'GET', requestId: 'health-request' },
    );
    expect(server.reply.mock.calls[0][1]).toEqual({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Internal server error',
      details: null,
      requestId: 'health-request',
    });
    expect(server.recordOtpFailure).not.toHaveBeenCalled();

    const client = runFilter(
      new HttpException('Forbidden', HttpStatus.FORBIDDEN),
      '/api/v1/admin/orders',
      { method: 'GET', requestId: 'admin-request' },
    );
    expect(client.reply.mock.calls[0][1]).toEqual({
      code: 'FORBIDDEN',
      message: 'Forbidden',
      details: null,
      requestId: 'admin-request',
    });
    expect(client.reply.mock.calls[0][2]).toBe(HttpStatus.FORBIDDEN);
  });
});
