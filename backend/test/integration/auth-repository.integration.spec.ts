import { execFileSync } from 'node:child_process';
import { createHash, randomUUID } from 'node:crypto';
import { resolve } from 'node:path';
import { Pool } from 'pg';
import { PostgresAuthRepository } from '../../src/auth/adapters/postgres-auth.repository';
import type { StoredOtpChallenge } from '../../src/auth/application/auth-repository.types';

const databaseUrl = process.env.DATABASE_URL;
const externalProcessTimeoutMs = 30_000;

function runMigrations(): void {
  execFileSync('npm', ['run', 'migrate'], {
    cwd: resolve(__dirname, '../..'),
    env: {
      ...process.env,
      JEST_WORKER_ID: undefined,
      NODE_ENV: 'local',
      PORT: '3000',
      DATABASE_URL: databaseUrl,
    },
    stdio: 'inherit',
  });
}

function createPhone(): string {
  return '+7999' + Math.floor(Math.random() * 1_000_0000).toString().padStart(7, '0');
}

async function createStoredSession(
  pool: Pool,
  userId: string,
  refreshTokenHash: string,
  expiresAt: Date,
): Promise<{ id: string; refreshTokenHash: string; expiresAt: Date }> {
  const id = randomUUID();
  const result = await pool.query<{ id: string; refresh_token_hash: string; expires_at: Date }>(
    `INSERT INTO sessions (id, user_id, refresh_token_hash, expires_at)
     VALUES ($1, $2, $3, $4)
     RETURNING id, refresh_token_hash, expires_at`,
    [id, userId, refreshTokenHash, expiresAt],
  );
  const session = result.rows[0];

  if (session === undefined) {
    throw new Error('Session was not created');
  }

  return {
    id: session.id,
    refreshTokenHash: session.refresh_token_hash,
    expiresAt: session.expires_at,
  };
}

async function reserveChallenge(
  repository: PostgresAuthRepository,
  phone: string,
  codeHash: string,
  expiresAt: Date,
  sentAt: Date,
  challengeId = randomUUID(),
): Promise<StoredOtpChallenge> {
  const reservation = await repository.reserveOtpChallenge(
    phone,
    codeHash,
    expiresAt,
    sentAt,
    challengeId,
  );

  if (reservation.status !== 'created') {
    throw new Error('OTP challenge was rate limited unexpectedly');
  }

  return reservation.challenge;
}

describe('PostgreSQL repository авторизации', () => {
  let pool: Pool;
  let repository: PostgresAuthRepository;

  beforeAll(() => {
    if (databaseUrl === undefined) {
      throw new Error('DATABASE_URL is required for integration tests');
    }

    pool = new Pool({ connectionString: databaseUrl });
    repository = new PostgresAuthRepository(pool);
    runMigrations();
  });

  afterAll(async () => {
    await pool?.end();
  });

  it(
    'создаёт OTP-задачу с заданным идентификатором',
    async () => {
      const phone = createPhone();
      const now = new Date();
      const codeHash = randomUUID();
      const challengeId = randomUUID();
      const created = await reserveChallenge(
        repository,
        phone,
        codeHash,
        new Date(now.getTime() + 300_000),
        now,
        challengeId,
      );

      expect(created.id).toBe(challengeId);
      expect(await repository.findOpenOtpChallenge(phone)).toMatchObject({ codeHash });

    },
    externalProcessTimeoutMs,
  );

  it(
    'атомарно резервирует одну OTP-задачу для одинакового номера и не создаёт лишнюю строку',
    async () => {
      const phone = createPhone();
      const now = new Date();
      const reservations = await Promise.all([
        repository.reserveOtpChallenge(phone, randomUUID(), new Date(now.getTime() + 300_000), now, randomUUID()),
        repository.reserveOtpChallenge(phone, randomUUID(), new Date(now.getTime() + 300_000), now, randomUUID()),
      ]);

      expect(reservations.map(({ status }) => status).sort()).toEqual(['created', 'rate_limited']);
      expect(await repository.findOpenOtpChallenge(phone)).not.toBeNull();

      const result = await pool.query<{ total: number; open: number }>(
        `SELECT COUNT(*)::int AS total, COUNT(*) FILTER (WHERE consumed_at IS NULL)::int AS open
         FROM otp_challenges
         WHERE phone_e164 = $1`,
        [phone],
      );
      expect(result.rows).toEqual([{ total: 1, open: 1 }]);
    },
    externalProcessTimeoutMs,
  );

  it(
    'ограничивает повторную отправку на 59999 мс, точной границе и при откате часов',
    async () => {
      const phone = createPhone();
      const now = new Date();
      const first = await repository.reserveOtpChallenge(
        phone,
        randomUUID(),
        new Date(now.getTime() + 300_000),
        now,
        randomUUID(),
      );
      expect(first.status).toBe('created');

      await expect(repository.reserveOtpChallenge(
        phone,
        randomUUID(),
        new Date(now.getTime() + 359_999),
        new Date(now.getTime() + 59_999),
        randomUUID(),
      )).resolves.toEqual({ status: 'rate_limited' });
      const afterShortCooldown = await pool.query<{ total: number; open: number }>(
        `SELECT COUNT(*)::int AS total, COUNT(*) FILTER (WHERE consumed_at IS NULL)::int AS open
         FROM otp_challenges
         WHERE phone_e164 = $1`,
        [phone],
      );
      expect(afterShortCooldown.rows).toEqual([{ total: 1, open: 1 }]);
      await expect(repository.reserveOtpChallenge(
        phone,
        randomUUID(),
        new Date(now.getTime() + 360_000),
        new Date(now.getTime() + 60_000),
        randomUUID(),
      )).resolves.toMatchObject({ status: 'created' });
      const beforeRollback = await pool.query<{ total: number; open: number }>(
        `SELECT COUNT(*)::int AS total, COUNT(*) FILTER (WHERE consumed_at IS NULL)::int AS open
         FROM otp_challenges
         WHERE phone_e164 = $1`,
        [phone],
      );
      expect(beforeRollback.rows).toEqual([{ total: 2, open: 1 }]);
      await expect(repository.reserveOtpChallenge(
        phone,
        randomUUID(),
        new Date(now.getTime() + 359_999),
        new Date(now.getTime() + 59_999),
        randomUUID(),
      )).resolves.toEqual({ status: 'rate_limited' });
      const afterRollback = await pool.query<{ total: number; open: number }>(
        `SELECT COUNT(*)::int AS total, COUNT(*) FILTER (WHERE consumed_at IS NULL)::int AS open
         FROM otp_challenges
         WHERE phone_e164 = $1`,
        [phone],
      );
      expect(afterRollback.rows).toEqual([{ total: 2, open: 1 }]);
    },
    externalProcessTimeoutMs,
  );

  it(
    'разрешает параллельные резервирования для разных номеров',
    async () => {
      const now = new Date();
      const reservations = await Promise.all([
        repository.reserveOtpChallenge(createPhone(), randomUUID(), new Date(now.getTime() + 300_000), now, randomUUID()),
        repository.reserveOtpChallenge(createPhone(), randomUUID(), new Date(now.getTime() + 300_000), now, randomUUID()),
      ]);

      expect(reservations.map(({ status }) => status)).toEqual(['created', 'created']);
    },
    externalProcessTimeoutMs,
  );

  it(
    'откатывает invalidation при ошибке вставки OTP-задачи',
    async () => {
      const phone = createPhone();
      const now = new Date();
      const first = await reserveChallenge(
        repository,
        phone,
        randomUUID(),
        new Date(now.getTime() + 300_000),
        now,
      );

      await expect(repository.reserveOtpChallenge(
        phone,
        randomUUID(),
        new Date(now.getTime() + 360_000),
        new Date(now.getTime() + 60_000),
        first.id,
      )).rejects.toMatchObject({ code: '23505' });
      expect(await repository.findOpenOtpChallenge(phone)).toMatchObject({ id: first.id });
    },
    externalProcessTimeoutMs,
  );

  it(
    'не закрывает новую OTP-задачу при поздней invalidation старой',
    async () => {
      const phone = createPhone();
      const now = new Date();
      const older = await reserveChallenge(
        repository,
        phone,
        randomUUID(),
        new Date(now.getTime() + 300_000),
        now,
      );
      const newer = await reserveChallenge(
        repository,
        phone,
        randomUUID(),
        new Date(now.getTime() + 360_000),
        new Date(now.getTime() + 60_000),
      );

      await repository.invalidateOtpChallenge(older.id, new Date(now.getTime() + 2_000));
      expect(await repository.findOpenOtpChallenge(phone)).toMatchObject({ id: newer.id });
    },
    externalProcessTimeoutMs,
  );

  it(
    'атомарно подтверждает OTP, сохраняет роль сотрудника и откатывает ошибку сессии',
    async () => {
      const staffPhone = createPhone();
      await pool.query(`INSERT INTO users (phone_e164, role) VALUES ($1, 'barista')`, [staffPhone]);
      const now = new Date();
      const codeHash = randomUUID();
      await reserveChallenge(
        repository,
        staffPhone,
        codeHash,
        new Date(now.getTime() + 300_000),
        now,
      );
      const sessionId = randomUUID();
      const refreshToken = sessionId + '.refresh-secret';
      const refreshTokenHash = createHash('sha256').update(refreshToken).digest('hex');
      const authenticated = await repository.verifyOtpAndCreateSession(
        staffPhone,
        codeHash,
        now,
        sessionId,
        refreshTokenHash,
        new Date(now.getTime() + 3_600_000),
      );
      expect(authenticated).toMatchObject({
        status: 'authenticated',
        user: { role: 'barista' },
        session: { id: sessionId, refreshTokenHash },
      });
      expect(await repository.findSessionByRefreshTokenHash(refreshTokenHash)).toMatchObject({
        id: sessionId,
      });
      expect(await repository.verifyOtpAndCreateSession(
        staffPhone,
        codeHash,
        now,
        randomUUID(),
        randomUUID(),
        new Date(now.getTime() + 3_600_000),
      )).toMatchObject({ status: 'unavailable' });

      const customer = await repository.findOrCreateCustomer(createPhone());
      const duplicateHash = randomUUID();
      await createStoredSession(
        pool,
        customer.id,
        duplicateHash,
        new Date(now.getTime() + 3_600_000),
      );
      const rollbackPhone = createPhone();
      const rollbackChallenge = await reserveChallenge(
        repository,
        rollbackPhone,
        randomUUID(),
        new Date(now.getTime() + 300_000),
        now,
      );
      await expect(
        repository.verifyOtpAndCreateSession(
          rollbackPhone,
          rollbackChallenge.codeHash,
          now,
          randomUUID(),
          duplicateHash,
          new Date(now.getTime() + 3_600_000),
        ),
      ).rejects.toMatchObject({ code: '23505' });
      expect(await repository.findOpenOtpChallenge(rollbackPhone)).toMatchObject({
        id: rollbackChallenge.id,
      });
      expect(
        await pool.query('SELECT id FROM users WHERE phone_e164 = $1', [rollbackPhone]),
      ).toMatchObject({ rowCount: 0 });

      const conflictingPhone = createPhone();
      const conflictingChallenge = await reserveChallenge(
        repository,
        conflictingPhone,
        randomUUID(),
        new Date(now.getTime() + 300_000),
        now,
      );
      await expect(
        repository.verifyOtpAndCreateSession(
          conflictingPhone,
          conflictingChallenge.codeHash,
          now,
          sessionId,
          randomUUID(),
          new Date(now.getTime() + 3_600_000),
        ),
      ).resolves.toEqual({ status: 'session_conflict' });
      expect(await repository.findOpenOtpChallenge(conflictingPhone)).toMatchObject({
        id: conflictingChallenge.id,
      });
    },
    externalProcessTimeoutMs,
  );

  it(
    'вращает и отзывает сессию по id с фактической ролью пользователя',
    async () => {
      const staffPhone = createPhone();
      const now = new Date();
      await pool.query(`INSERT INTO users (phone_e164, role) VALUES ($1, 'administrator')`, [staffPhone]);
      const staff = await repository.findOrCreateCustomer(staffPhone);
      const tokenHash = randomUUID();
      const session = await createStoredSession(
        pool,
        staff.id,
        tokenHash,
        new Date(now.getTime() + 3_600_000),
      );
      expect(await repository.findSessionWithUser(session.id, now)).toMatchObject({
        user: { role: 'administrator' },
      });

      const rotated = await repository.rotateSession(session.id, tokenHash, randomUUID(), new Date());
      expect(rotated).toMatchObject({ status: 'rotated', user: { role: 'administrator' } });
      if (rotated.status !== 'rotated') {
        throw new Error('Session was not rotated');
      }
      expect(rotated.session.expiresAt).toEqual(session.expiresAt);

      const mismatch = await repository.rotateSession(
        session.id,
        randomUUID(),
        randomUUID(),
        new Date(),
      );
      expect(mismatch).toMatchObject({ status: 'mismatch', session: { id: session.id } });
      expect(await repository.findCurrentUser(session.id, new Date())).toBeNull();
      expect(await repository.revokeSession(session.id, new Date())).toMatchObject({ id: session.id });

      const expiring = await createStoredSession(
        pool,
        staff.id,
        randomUUID(),
        new Date(Date.now() + 1_000),
      );
      const afterExpiry = new Date(Date.now() + 2_000);
      expect(await repository.findSessionWithUser(expiring.id, afterExpiry)).toBeNull();
      expect(await repository.rotateSession(expiring.id, expiring.refreshTokenHash, randomUUID(), afterExpiry))
        .toEqual({ status: 'unavailable' });
    },
    externalProcessTimeoutMs,
  );

  it(
    'выходит только при совпадении session id и refresh token hash',
    async () => {
      const now = new Date();
      const customer = await repository.findOrCreateCustomer(createPhone());
      const session = await createStoredSession(
        pool,
        customer.id,
        randomUUID(),
        new Date(now.getTime() + 3_600_000),
      );

      expect(await repository.logoutSession(session.id, randomUUID(), now)).toEqual({
        status: 'unavailable',
      });
      expect(await repository.findCurrentUser(session.id, now)).not.toBeNull();
      expect(await repository.logoutSession(randomUUID(), session.refreshTokenHash, now)).toEqual({
        status: 'unavailable',
      });
      expect(
        await repository.logoutSession(session.id, session.refreshTokenHash, now),
      ).toMatchObject({ status: 'revoked', session: { id: session.id } });
      expect(await repository.logoutSession(session.id, session.refreshTokenHash, now)).toEqual({
        status: 'unavailable',
      });
    },
    externalProcessTimeoutMs,
  );
});
