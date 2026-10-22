import type { Pool, PoolClient } from "pg";
import type { UserRole } from "../../auth/domain/auth.types";
import type {
  StaffUsersReader,
  StaffUsersTransaction,
  StaffUsersUnitOfWork,
  StaffUserAudit,
  OperationsUserCreation,
} from "../application/staff-users.repository.types";
import { StaffUserError } from "../domain/staff-user.policy";
import type {
  StaffUser,
  StaffUserDetails,
  StaffUserFilter,
} from "../domain/staff-user.types";
import { staffUsersMembershipLock } from "./staff-users-lock.constants";
import { staffUserColumns } from "./postgres-staff-users.repository.constants";
import type { DatabaseRow } from "./postgres-staff-users.repository.types";

export class PostgresStaffUsersRepository
  implements StaffUsersReader, StaffUsersUnitOfWork
{
  constructor(private readonly getPool: () => Pool) {}

  async list(filter: StaffUserFilter): Promise<StaffUser[]> {
    const result = await this.getPool().query<DatabaseRow>(
      `SELECT ${staffUserColumns} FROM users
       WHERE ($1::text IS NULL OR strpos(lower(name), lower($1)) > 0 OR strpos(phone_e164, $1) > 0)
         AND ($2::user_role IS NULL OR role = $2)
         AND ($3::boolean IS NULL OR (blocked_at IS NOT NULL) = $3)
       ORDER BY name NULLS LAST, phone_e164, id`,
      [filter.search ?? null, filter.role ?? null, filter.blocked ?? null],
    );
    return result.rows.map(parseStaffUser);
  }

  async run<Result>(
    operation: (repository: StaffUsersTransaction) => Promise<Result>,
  ): Promise<Result> {
    const client = await this.getPool().connect();
    try {
      await client.query("BEGIN");
      await client.query(
        "SELECT pg_advisory_xact_lock(hashtextextended($1, 0))",
        [staffUsersMembershipLock],
      );
      const result = await operation(new PostgresStaffUsersTransaction(client));
      await client.query("COMMIT");
      return result;
    } catch (error) {
      await client.query("ROLLBACK");
      if (this.isDuplicatePhone(error)) {
        throw new StaffUserError("USER_PHONE_CONFLICT");
      }
      throw error;
    } finally {
      client.release();
    }
  }

  private isDuplicatePhone(error: unknown): boolean {
    return (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "23505" &&
      "constraint" in error &&
      error.constraint === "users_phone_e164_key"
    );
  }
}

class PostgresStaffUsersTransaction implements StaffUsersTransaction {
  constructor(private readonly client: PoolClient) {}

  async findById(id: string): Promise<StaffUser | null> {
    const result = await this.client.query<DatabaseRow>(
      `SELECT ${staffUserColumns} FROM users WHERE id = $1 FOR UPDATE`,
      [id],
    );
    return result.rows[0] === undefined ? null : parseStaffUser(result.rows[0]);
  }

  async countActiveAdministrators(): Promise<number> {
    const result = await this.client.query<DatabaseRow>(
      "SELECT count(*)::integer AS count FROM users WHERE role = 'administrator' AND blocked_at IS NULL",
    );
    const count = result.rows[0]?.count;
    if (
      typeof count !== "number" ||
      !Number.isSafeInteger(count) ||
      count < 0
    ) {
      throw new Error("Invalid administrator count");
    }
    return count;
  }

  async findOrCreateForOperations(
    phoneE164: string,
    role: UserRole,
  ): Promise<OperationsUserCreation> {
    const inserted = await this.client.query<DatabaseRow>(
      `INSERT INTO users (phone_e164, role) VALUES ($1, $2) ON CONFLICT (phone_e164) DO NOTHING RETURNING ${staffUserColumns}`,
      [phoneE164, role],
    );
    if (inserted.rows[0] !== undefined) {
      return { created: true, user: parseStaffUser(inserted.rows[0]) };
    }
    const result = await this.client.query<DatabaseRow>(
      `SELECT ${staffUserColumns} FROM users WHERE phone_e164 = $1 FOR UPDATE`,
      [phoneE164],
    );
    return { created: false, user: this.requireRow(result.rows[0]) };
  }

  async create(details: StaffUserDetails): Promise<StaffUser> {
    const result = await this.client.query<DatabaseRow>(
      `INSERT INTO users (name, phone_e164, role) VALUES ($1, $2, $3) RETURNING ${staffUserColumns}`,
      [details.name, details.phoneE164, details.role],
    );
    return this.requireRow(result.rows[0]);
  }

  async changeRole(userId: string, role: UserRole): Promise<StaffUser> {
    const result = await this.client.query<DatabaseRow>(
      `UPDATE users SET role = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING ${staffUserColumns}`,
      [userId, role],
    );
    return this.requireRow(result.rows[0]);
  }

  async changeBlocked(
    userId: string,
    blocked: boolean,
    actorId: string,
  ): Promise<StaffUser> {
    const result = await this.client.query<DatabaseRow>(
      `UPDATE users SET blocked_at = CASE WHEN $2 THEN CURRENT_TIMESTAMP ELSE NULL END, blocked_by = CASE WHEN $2 THEN $3::uuid ELSE NULL END, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING ${staffUserColumns}`,
      [userId, blocked, actorId],
    );
    return this.requireRow(result.rows[0]);
  }

  async revokeAccess(userId: string): Promise<void> {
    await this.client.query(
      "UPDATE sessions SET revoked_at = GREATEST(CURRENT_TIMESTAMP, created_at) WHERE user_id = $1 AND revoked_at IS NULL",
      [userId],
    );
    await this.client.query(
      "DELETE FROM push_subscriptions WHERE user_id = $1",
      [userId],
    );
  }

  async writeAudit(event: StaffUserAudit): Promise<void> {
    await this.client.query(
      `INSERT INTO audit_events (actor_id, entity_type, entity_id, action, before_state, after_state, request_id) VALUES ($1, 'user', $2, $3, $4::jsonb, $5::jsonb, $6)`,
      [
        event.actorId,
        event.after.id,
        event.action,
        JSON.stringify(event.before),
        JSON.stringify(event.after),
        event.requestId,
      ],
    );
  }
  private requireRow(row: DatabaseRow | undefined): StaffUser {
    if (row === undefined) {
      throw new Error("User command returned no row");
    }
    return parseStaffUser(row);
  }
}

function parseStaffUser(row: DatabaseRow): StaffUser {
  const {
    id,
    name,
    phone_e164: phoneE164,
    role,
    blocked,
    created_at: createdAt,
    updated_at: updatedAt,
  } = row;
  if (
    typeof id !== "string" ||
    !(name === null || (typeof name === "string" && name.trim() !== "")) ||
    typeof phoneE164 !== "string" ||
    !/^\+7\d{10}$/.test(phoneE164) ||
    !(role === "customer" || role === "barista" || role === "administrator") ||
    typeof blocked !== "boolean" ||
    !(createdAt instanceof Date) ||
    Number.isNaN(createdAt.getTime()) ||
    !(updatedAt instanceof Date) ||
    Number.isNaN(updatedAt.getTime())
  ) {
    throw new Error("Invalid PostgreSQL staff user row");
  }
  return { id, name, phoneE164, role, blocked, createdAt, updatedAt };
}
