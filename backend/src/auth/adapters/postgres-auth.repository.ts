import type { Pool, PoolClient } from 'pg';
import type {
  AuthRepository,
  AuthSession,
  AuthUser,
  OtpChallengeReservation,
  OtpAuthentication,
  SessionLogout,
  SessionRotation,
  SessionWithUser,
  StoredOtpChallenge,
} from '../application/auth-repository.types';
import { userRoles } from '../domain/auth.constants';
import type { UserRole } from '../domain/auth.types';
import { otpResendIntervalMs } from '../domain/otp-policy.constants';
import type { DatabaseRow } from './postgres-auth.repository.types';

class SessionIdConflictError extends Error {}

export class PostgresAuthRepository implements AuthRepository {
  constructor(private readonly pool: Pool) {}

  async findOpenOtpChallenge(phoneE164: string): Promise<StoredOtpChallenge | null> {
    const result = await this.pool.query<DatabaseRow>(
      `SELECT id, code_hash, expires_at, consumed_at, sent_at, attempts
       FROM otp_challenges
       WHERE phone_e164 = $1 AND consumed_at IS NULL
       ORDER BY sent_at DESC
       LIMIT 1`,
      [phoneE164],
    );

    return parseOptionalRow(result.rows[0], parseOtpChallenge);
  }

  async reserveOtpChallenge(
    phoneE164: string,
    codeHash: string,
    expiresAt: Date,
    sentAt: Date,
    challengeId: string,
  ): Promise<OtpChallengeReservation> {
    return this.withTransaction(async (client) => {
      await client.query('SELECT pg_advisory_xact_lock(hashtextextended($1, 0))', [phoneE164]);

      const latest = await client.query<DatabaseRow>(
        `SELECT sent_at
         FROM otp_challenges
         WHERE phone_e164 = $1 AND consumed_at IS NULL AND attempts < 5
         ORDER BY sent_at DESC
         LIMIT 1`,
        [phoneE164],
      );
      const latestSentAt = latest.rows[0] === undefined ? null : readDate(latest.rows[0], 'sent_at');

      if (
        latestSentAt !== null &&
        sentAt.getTime() - latestSentAt.getTime() < otpResendIntervalMs
      ) {
        return { status: 'rate_limited' };
      }

      await client.query(
        `UPDATE otp_challenges
         SET consumed_at = GREATEST($2, sent_at)
         WHERE phone_e164 = $1 AND consumed_at IS NULL`,
        [phoneE164, sentAt],
      );

      const result = await client.query<DatabaseRow>(
        `INSERT INTO otp_challenges (id, phone_e164, code_hash, expires_at, sent_at)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id, code_hash, expires_at, consumed_at, sent_at, attempts`,
        [challengeId, phoneE164, codeHash, expiresAt, sentAt],
      );

      return { status: 'created', challenge: parseRequiredRow(result.rows[0], parseOtpChallenge) };
    });
  }

  async invalidateOtpChallenge(challengeId: string, now: Date): Promise<void> {
    await this.pool.query(
      `UPDATE otp_challenges
       SET consumed_at = GREATEST($2, sent_at)
       WHERE id = $1 AND consumed_at IS NULL`,
      [challengeId, now],
    );
  }

  async verifyOtpAndCreateSession(
    phoneE164: string,
    codeHash: string,
    now: Date,
    sessionId: string,
    refreshTokenHash: string,
    sessionExpiresAt: Date,
  ): Promise<OtpAuthentication> {
    try {
      return await this.withTransaction(async (client) => {
      const selected = await client.query<DatabaseRow>(
        `SELECT id, code_hash, expires_at, consumed_at, sent_at, attempts
         FROM otp_challenges
         WHERE phone_e164 = $1 AND consumed_at IS NULL
         ORDER BY sent_at DESC
         LIMIT 1
         FOR UPDATE`,
        [phoneE164],
      );
      const challenge = parseOptionalRow(selected.rows[0], parseOtpChallenge);

      if (challenge === null || challenge.expiresAt <= now || challenge.attempts >= 5) {
        return { status: 'unavailable', challenge };
      }

      if (challenge.codeHash !== codeHash) {
        const attempted = await client.query<DatabaseRow>(
          `UPDATE otp_challenges
           SET attempts = attempts + 1
           WHERE id = $1
           RETURNING id, code_hash, expires_at, consumed_at, sent_at, attempts`,
          [challenge.id],
        );

        return { status: 'invalid', challenge: parseRequiredRow(attempted.rows[0], parseOtpChallenge) };
      }

      await client.query(
        `UPDATE otp_challenges
         SET consumed_at = GREATEST($2, sent_at)
         WHERE id = $1`,
        [challenge.id, now],
      );
      await client.query(
        `INSERT INTO users (phone_e164, role)
         VALUES ($1, 'customer')
         ON CONFLICT (phone_e164) DO NOTHING`,
        [phoneE164],
      );
      const userResult = await client.query<DatabaseRow>(
        `SELECT id, phone_e164, role
         FROM users
         WHERE phone_e164 = $1
         FOR UPDATE`,
        [phoneE164],
      );
      const user = parseRequiredRow(userResult.rows[0], parseAuthUser);
      const sessionResult = await client.query<DatabaseRow>(
        `INSERT INTO sessions (id, user_id, refresh_token_hash, expires_at)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (id) DO NOTHING
         RETURNING id, user_id, refresh_token_hash, expires_at, revoked_at, created_at, rotated_at`,
        [sessionId, user.id, refreshTokenHash, sessionExpiresAt],
      );
      if (sessionResult.rows[0] === undefined) {
        throw new SessionIdConflictError();
      }

      return {
        status: 'authenticated',
        user,
        session: parseRequiredRow(sessionResult.rows[0], parseSession),
      };
      });
    } catch (error) {
      if (error instanceof SessionIdConflictError) {
        return { status: 'session_conflict' };
      }

      throw error;
    }
  }

  async findOrCreateCustomer(phoneE164: string): Promise<AuthUser> {
    return this.withTransaction(async (client) => {
      await client.query(
        `INSERT INTO users (phone_e164, role)
         VALUES ($1, 'customer')
         ON CONFLICT (phone_e164) DO NOTHING`,
        [phoneE164],
      );

      const result = await client.query<DatabaseRow>(
        `SELECT id, phone_e164, role
         FROM users
         WHERE phone_e164 = $1
         FOR UPDATE`,
        [phoneE164],
      );

      return parseRequiredRow(result.rows[0], parseAuthUser);
    });
  }

  async findSessionByRefreshTokenHash(refreshTokenHash: string): Promise<AuthSession | null> {
    const result = await this.pool.query<DatabaseRow>(
      `SELECT id, user_id, refresh_token_hash, expires_at, revoked_at, created_at, rotated_at
       FROM sessions
       WHERE refresh_token_hash = $1`,
      [refreshTokenHash],
    );

    return parseOptionalRow(result.rows[0], parseSession);
  }

  async findSessionWithUser(sessionId: string, now: Date): Promise<SessionWithUser | null> {
    const result = await this.pool.query<DatabaseRow>(
      `SELECT sessions.id, sessions.user_id, sessions.refresh_token_hash, sessions.expires_at,
              sessions.revoked_at, sessions.created_at, sessions.rotated_at,
              users.id AS current_user_id, users.phone_e164 AS current_user_phone_e164,
              users.role AS current_user_role
       FROM sessions
       JOIN users ON users.id = sessions.user_id
       WHERE sessions.id = $1 AND sessions.revoked_at IS NULL AND sessions.expires_at > $2`,
      [sessionId, now],
    );

    return parseOptionalRow(result.rows[0], parseSessionWithUser);
  }

  async rotateSession(
    sessionId: string,
    expectedRefreshTokenHash: string,
    nextRefreshTokenHash: string,
    now: Date,
  ): Promise<SessionRotation> {
    return this.withTransaction(async (client) => {
      const selected = await client.query<DatabaseRow>(
        `SELECT sessions.id, sessions.user_id, sessions.refresh_token_hash, sessions.expires_at,
                sessions.revoked_at, sessions.created_at, sessions.rotated_at,
                users.id AS current_user_id, users.phone_e164 AS current_user_phone_e164,
                users.role AS current_user_role
         FROM sessions
         JOIN users ON users.id = sessions.user_id
         WHERE sessions.id = $1
         FOR UPDATE OF sessions`,
        [sessionId],
      );
      const found = parseOptionalRow(selected.rows[0], parseSessionWithUser);

      if (
        found === null ||
        found.session.revokedAt !== null ||
        found.session.expiresAt <= now
      ) {
        return { status: 'unavailable' };
      }

      if (found.session.refreshTokenHash !== expectedRefreshTokenHash) {
        const revoked = await client.query<DatabaseRow>(
          `UPDATE sessions
           SET revoked_at = GREATEST($2, created_at)
           WHERE id = $1
           RETURNING id, user_id, refresh_token_hash, expires_at, revoked_at, created_at, rotated_at`,
          [found.session.id, now],
        );

        return {
          status: 'mismatch',
          session: parseRequiredRow(revoked.rows[0], parseSession),
          user: found.user,
        };
      }

      const rotated = await client.query<DatabaseRow>(
        `UPDATE sessions
         SET refresh_token_hash = $2, rotated_at = GREATEST($3, created_at)
         WHERE id = $1
         RETURNING id, user_id, refresh_token_hash, expires_at, revoked_at, created_at, rotated_at`,
        [found.session.id, nextRefreshTokenHash, now],
      );

      return {
        status: 'rotated',
        session: parseRequiredRow(rotated.rows[0], parseSession),
        user: found.user,
      };
    });
  }

  async revokeSession(sessionId: string, now: Date): Promise<AuthSession | null> {
    return this.withTransaction(async (client) => {
      const selected = await client.query<DatabaseRow>(
        `SELECT id, user_id, refresh_token_hash, expires_at, revoked_at, created_at, rotated_at
         FROM sessions
         WHERE id = $1
         FOR UPDATE`,
        [sessionId],
      );
      const session = parseOptionalRow(selected.rows[0], parseSession);

      if (session === null || session.revokedAt !== null) {
        return session;
      }

      const revoked = await client.query<DatabaseRow>(
        `UPDATE sessions
         SET revoked_at = GREATEST($2, created_at)
         WHERE id = $1
         RETURNING id, user_id, refresh_token_hash, expires_at, revoked_at, created_at, rotated_at`,
        [session.id, now],
      );

      return parseRequiredRow(revoked.rows[0], parseSession);
    });
  }

  async logoutSession(
    sessionId: string,
    expectedRefreshTokenHash: string,
    now: Date,
  ): Promise<SessionLogout> {
    return this.withTransaction(async (client) => {
      const selected = await client.query<DatabaseRow>(
        `SELECT id, user_id, refresh_token_hash, expires_at, revoked_at, created_at, rotated_at
         FROM sessions
         WHERE id = $1
         FOR UPDATE`,
        [sessionId],
      );
      const session = parseOptionalRow(selected.rows[0], parseSession);

      if (
        session === null ||
        session.revokedAt !== null ||
        session.refreshTokenHash !== expectedRefreshTokenHash
      ) {
        return { status: 'unavailable' };
      }

      const revoked = await client.query<DatabaseRow>(
        `UPDATE sessions
         SET revoked_at = GREATEST($2, created_at)
         WHERE id = $1
         RETURNING id, user_id, refresh_token_hash, expires_at, revoked_at, created_at, rotated_at`,
        [session.id, now],
      );

      return { status: 'revoked', session: parseRequiredRow(revoked.rows[0], parseSession) };
    });
  }

  async findCurrentUser(sessionId: string, now: Date): Promise<AuthUser | null> {
    const result = await this.pool.query<DatabaseRow>(
      `SELECT users.id, users.phone_e164, users.role
       FROM sessions
       JOIN users ON users.id = sessions.user_id
       WHERE sessions.id = $1 AND sessions.revoked_at IS NULL AND sessions.expires_at > $2`,
      [sessionId, now],
    );

    return parseOptionalRow(result.rows[0], parseAuthUser);
  }

  private async withTransaction<Result>(
    operation: (client: PoolClient) => Promise<Result>,
  ): Promise<Result> {
    const client = await this.pool.connect();

    try {
      await client.query('BEGIN');
      const result = await operation(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}

function parseOptionalRow<Result>(
  row: DatabaseRow | undefined,
  parser: (row: DatabaseRow) => Result,
): Result | null {
  return row === undefined ? null : parser(row);
}

function parseRequiredRow<Result>(
  row: DatabaseRow | undefined,
  parser: (row: DatabaseRow) => Result,
): Result {
  if (row === undefined) {
    throw new Error('PostgreSQL returned no row');
  }

  return parser(row);
}

function parseOtpChallenge(row: DatabaseRow): StoredOtpChallenge {
  return {
    id: readString(row, 'id'),
    codeHash: readString(row, 'code_hash'),
    expiresAt: readDate(row, 'expires_at'),
    consumedAt: readNullableDate(row, 'consumed_at'),
    sentAt: readDate(row, 'sent_at'),
    attempts: readAttempts(row),
  };
}

function parseAuthUser(row: DatabaseRow): AuthUser {
  return {
    id: readString(row, 'id'),
    phoneE164: readString(row, 'phone_e164'),
    role: readUserRole(row),
  };
}

function parseSession(row: DatabaseRow): AuthSession {
  return {
    id: readString(row, 'id'),
    userId: readString(row, 'user_id'),
    refreshTokenHash: readString(row, 'refresh_token_hash'),
    expiresAt: readDate(row, 'expires_at'),
    revokedAt: readNullableDate(row, 'revoked_at'),
    createdAt: readDate(row, 'created_at'),
    rotatedAt: readNullableDate(row, 'rotated_at'),
  };
}

function parseSessionWithUser(row: DatabaseRow): SessionWithUser {
  return {
    session: parseSession(row),
    user: {
      id: readString(row, 'current_user_id'),
      phoneE164: readString(row, 'current_user_phone_e164'),
      role: readUserRoleFromKey(row, 'current_user_role'),
    },
  };
}

function readString(row: DatabaseRow, key: string): string {
  const value = row[key];

  if (typeof value !== 'string') {
    throw new Error('Invalid PostgreSQL row field: ' + key);
  }

  return value;
}

function readDate(row: DatabaseRow, key: string): Date {
  const value = row[key];

  if (!(value instanceof Date) || Number.isNaN(value.getTime())) {
    throw new Error('Invalid PostgreSQL row field: ' + key);
  }

  return value;
}

function readNullableDate(row: DatabaseRow, key: string): Date | null {
  const value = row[key];

  if (value === null) {
    return null;
  }

  return readDate(row, key);
}

function readAttempts(row: DatabaseRow): number {
  const value = row.attempts;

  if (typeof value !== 'number' || !Number.isInteger(value) || value < 0 || value > 5) {
    throw new Error('Invalid PostgreSQL row field: attempts');
  }

  return value;
}

function readUserRole(row: DatabaseRow): UserRole {
  return readUserRoleFromKey(row, 'role');
}

function readUserRoleFromKey(row: DatabaseRow, key: string): UserRole {
  const value = readString(row, key);

  if (!isUserRole(value)) {
    throw new Error('Invalid PostgreSQL row field: ' + key);
  }

  return value;
}

function isUserRole(value: string): value is UserRole {
  return userRoles.some((role) => role === value);
}
