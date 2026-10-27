import type { Pool, PoolClient } from "pg";
import type { UserRole } from "../../auth/domain/auth.types";
import { readAccountMemberships } from "../../auth/adapters/account-membership";
import type {
  StaffUsersReader,
  StaffUsersTransaction,
  StaffUsersUnitOfWork,
  StaffUserAudit,
  OperationsUserCreation,
  UserCommandContext,
  UserCommandTarget,
} from "../application/staff-users.repository.types";
import {
  StaffUserError,
  assertActiveAdministrator,
} from "../domain/staff-user.policy";
import type {
  StaffUser,
  StaffUserDetails,
  StaffUserFilter,
  Employee,
  EmployeeDetails,
  EmployeeFilter,
  Customer,
} from "../domain/staff-user.types";
import { staffUsersMembershipLock } from "./staff-users-lock.constants";
import {
  staffUserColumns,
  staffMembershipJoins,
  employeeColumns,
} from "./postgres-staff-users.repository.constants";
import type { DatabaseRow } from "./postgres-staff-users.repository.types";

export class PostgresStaffUsersRepository
  implements StaffUsersReader, StaffUsersUnitOfWork
{
  constructor(private readonly getPool: () => Pool) {}

  async list(filter: StaffUserFilter): Promise<StaffUser[]> {
    const result = await this.getPool().query<DatabaseRow>(
      `SELECT ${staffUserColumns} FROM users ${staffMembershipJoins}
       WHERE ($1::text IS NULL OR strpos(lower(users.name), lower($1)) > 0 OR strpos(users.phone_e164, $1) > 0)
       AND ($2::text IS NULL OR CASE WHEN employees.access_disabled_at IS NULL AND employees.role IS NOT NULL THEN employees.role::text ELSE 'customer' END = $2)
       AND ($3::boolean IS NULL OR (users.blocked_at IS NOT NULL) = $3)
       ORDER BY users.name NULLS LAST, users.phone_e164, users.id`,
      [filter.search ?? null, filter.role ?? null, filter.blocked ?? null],
    );
    return result.rows.map(parseStaffUser);
  }

  async listEmployees(filter: EmployeeFilter): Promise<Employee[]> {
    const result = await this.getPool().query<DatabaseRow>(
      `SELECT ${employeeColumns} FROM users JOIN employees ON employees.user_id = users.id
       WHERE ($1::text IS NULL OR strpos(lower(users.name), lower($1)) > 0 OR strpos(users.phone_e164, $1) > 0)
       AND ($2::staff_role IS NULL OR employees.role = $2)
       AND ($3::boolean IS NULL OR (employees.access_disabled_at IS NOT NULL OR users.blocked_at IS NOT NULL) = $3)
       ORDER BY users.name NULLS LAST, users.phone_e164, users.id`,
      [filter.search ?? null, filter.role ?? null, filter.blocked ?? null],
    );
    return result.rows.map(parseEmployee);
  }

  async listCustomers(search?: string): Promise<Customer[]> {
    const result = await this.getPool().query<DatabaseRow>(
      `SELECT users.id, users.name, users.phone_e164, customers.registered_at FROM users JOIN customers ON customers.user_id = users.id
       WHERE ($1::text IS NULL OR strpos(lower(users.name), lower($1)) > 0 OR strpos(users.phone_e164, $1) > 0)
       ORDER BY users.name NULLS LAST, users.phone_e164, users.id`,
      [search ?? null],
    );
    return result.rows.map((row) => ({
      id: readString(row, "id"),
      name: readString(row, "name"),
      phoneE164: readString(row, "phone_e164"),
      registeredAt: readDate(row, "registered_at"),
    }));
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
      if (
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        error.code === "23505" &&
        "constraint" in error &&
        error.constraint === "users_phone_e164_key"
      ) {
        throw new StaffUserError("USER_PHONE_CONFLICT");
      }
      throw error;
    } finally {
      client.release();
    }
  }
}

class PostgresStaffUsersTransaction implements StaffUsersTransaction {
  constructor(private readonly client: PoolClient) {}

  async authorizeCommand(
    context: UserCommandContext,
    target: UserCommandTarget,
  ): Promise<void> {
    // Новая строка ещё приватна транзакции; существующие аккаунты блокируем по ID до участий и сессий.
    if (target.createAccount && target.phoneE164 !== undefined) {
      await this.client.query(
        "INSERT INTO users(phone_e164) VALUES ($1) ON CONFLICT(phone_e164) DO NOTHING",
        [target.phoneE164],
      );
    }
    const accounts = await this.client.query<DatabaseRow>(
      `SELECT id FROM users WHERE id = $1 OR id = $2 OR phone_e164 = $3 ORDER BY id FOR UPDATE`,
      [context.actorId, target.userId ?? null, target.phoneE164 ?? null],
    );
    const ids = accounts.rows.map((row) => readString(row, "id"));
    await this.client.query(
      "SELECT user_id FROM customers WHERE user_id = ANY($1::uuid[]) ORDER BY user_id FOR UPDATE",
      [ids],
    );
    await this.client.query(
      "SELECT user_id FROM employees WHERE user_id = ANY($1::uuid[]) ORDER BY user_id FOR UPDATE",
      [ids],
    );
    const session = await this.client.query<DatabaseRow>(
      `SELECT id FROM sessions WHERE id = $1 AND user_id = $2 AND context = 'staff' AND revoked_at IS NULL AND expires_at > clock_timestamp() FOR UPDATE`,
      [context.sessionId, context.actorId],
    );
    if (session.rows[0] === undefined) {
      throw new StaffUserError("USER_SESSION_INVALID");
    }
    assertActiveAdministrator(await this.findById(context.actorId));
  }

  async findById(id: string): Promise<StaffUser | null> {
    const result = await this.client.query<DatabaseRow>(
      `SELECT ${staffUserColumns} FROM users ${staffMembershipJoins} WHERE users.id = $1`,
      [id],
    );
    return result.rows[0] === undefined ? null : parseStaffUser(result.rows[0]);
  }

  async findEmployee(userId: string): Promise<Employee | null> {
    const result = await this.client.query<DatabaseRow>(
      `SELECT ${employeeColumns} FROM users JOIN employees ON employees.user_id = users.id WHERE users.id = $1`,
      [userId],
    );
    return result.rows[0] === undefined ? null : parseEmployee(result.rows[0]);
  }

  async countActiveAdministrators(): Promise<number> {
    const result = await this.client.query<DatabaseRow>(
      `SELECT count(*)::integer AS count FROM employees JOIN users ON users.id = employees.user_id WHERE employees.role = 'administrator' AND employees.access_disabled_at IS NULL AND users.blocked_at IS NULL`,
    );
    const count = result.rows[0]?.count;
    if (
      typeof count !== "number" ||
      !Number.isSafeInteger(count) ||
      count < 0
    ) {
      throw new Error("Invalid administrator count.");
    }
    return count;
  }

  async findOrCreateForOperations(
    phoneE164: string,
    role: UserRole,
  ): Promise<OperationsUserCreation> {
    const inserted = await this.client.query<DatabaseRow>(
      "INSERT INTO users(phone_e164) VALUES ($1) ON CONFLICT (phone_e164) DO NOTHING RETURNING id",
      [phoneE164],
    );
    const account = await this.client.query<DatabaseRow>(
      "SELECT id FROM users WHERE phone_e164 = $1 FOR UPDATE",
      [phoneE164],
    );
    const id = readString(requiredRow(account.rows[0]), "id");
    await this.client.query(
      "SELECT user_id FROM customers WHERE user_id = $1 FOR UPDATE",
      [id],
    );
    await this.client.query(
      "SELECT user_id FROM employees WHERE user_id = $1 FOR UPDATE",
      [id],
    );
    if (inserted.rows[0] !== undefined) {
      await this.changeRole(id, role, id);
    }
    return {
      created: inserted.rows[0] !== undefined,
      user: await this.requireUser(id),
    };
  }

  async create(details: StaffUserDetails): Promise<StaffUser> {
    const result = await this.client.query<DatabaseRow>(
      "INSERT INTO users(name, phone_e164) VALUES ($1, $2) RETURNING id",
      [details.name, details.phoneE164],
    );
    const id = readString(requiredRow(result.rows[0]), "id");
    return this.changeRole(id, details.role, id);
  }

  async enrollEmployee(
    details: EmployeeDetails,
  ): Promise<{ before: StaffUser; after: StaffUser }> {
    const result = await this.client.query<DatabaseRow>(
      "SELECT id FROM users WHERE phone_e164 = $1",
      [details.phoneE164],
    );
    const id = readString(requiredRow(result.rows[0]), "id");
    const before = await this.requireUser(id);
    if (before.blocked) {
      throw new StaffUserError("USER_ACCESS_CONFLICT");
    }
    if (before.employee !== null) {
      throw new StaffUserError("USER_PHONE_CONFLICT");
    }
    if (before.name !== null && before.name !== details.name) {
      throw new StaffUserError("USER_NAME_CONFLICT");
    }
    if (before.name === null) {
      await this.client.query(
        "UPDATE users SET name = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $1",
        [id, details.name],
      );
    }
    const after = await this.changeRole(id, details.role, id);
    return { before, after };
  }

  async changeRole(
    userId: string,
    role: UserRole,
    actorId: string,
  ): Promise<StaffUser> {
    const before = await this.requireUser(userId);
    if (role === "customer") {
      if (before.employee?.accessEnabled) {
        await this.changeEmployeeAccess(userId, false, actorId);
      }
      if (before.name !== null && before.customer === null) {
        await this.client.query("INSERT INTO customers(user_id) VALUES ($1)", [
          userId,
        ]);
      }
    } else {
      await this.client.query(
        `INSERT INTO employees(user_id, role) VALUES ($1, $2)
        ON CONFLICT(user_id) DO UPDATE SET role = EXCLUDED.role, updated_at = CURRENT_TIMESTAMP WHERE employees.role <> EXCLUDED.role`,
        [userId, role],
      );
    }
    await this.client.query(
      "UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE id = $1",
      [userId],
    );
    return this.requireUser(userId);
  }

  async changeEmployeeAccess(
    userId: string,
    enabled: boolean,
    actorId: string,
  ): Promise<StaffUser> {
    const before = await this.requireUser(userId);
    if (before.employee === null) {
      throw new StaffUserError("USER_NOT_FOUND");
    }
    if (enabled && before.blocked) {
      throw new StaffUserError("USER_ACCESS_CONFLICT");
    }
    await this.client.query(
      `UPDATE employees SET access_disabled_at = CASE WHEN $2 THEN NULL ELSE CURRENT_TIMESTAMP END,
      access_disabled_by = CASE WHEN $2 THEN NULL ELSE $3::uuid END, updated_at = CURRENT_TIMESTAMP WHERE user_id = $1`,
      [userId, enabled, actorId],
    );
    return this.requireUser(userId);
  }

  async changeBlocked(
    userId: string,
    blocked: boolean,
    actorId: string,
  ): Promise<StaffUser> {
    await this.client.query(
      `UPDATE users SET blocked_at = CASE WHEN $2 THEN CURRENT_TIMESTAMP ELSE NULL END,
      blocked_by = CASE WHEN $2 THEN $3::uuid ELSE NULL END, updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
      [userId, blocked, actorId],
    );
    return this.requireUser(userId);
  }

  async revokeAccess(userId: string, context?: "staff"): Promise<void> {
    await this.client.query(
      `UPDATE sessions SET revoked_at = GREATEST(CURRENT_TIMESTAMP, created_at) WHERE user_id = $1 AND revoked_at IS NULL AND ($2::auth_context IS NULL OR context = $2)`,
      [userId, context ?? null],
    );
    await this.client.query(
      "DELETE FROM push_subscriptions WHERE user_id = $1 AND ($2::auth_context IS NULL OR context = $2)",
      [userId, context ?? null],
    );
  }

  async writeAudit(event: StaffUserAudit): Promise<void> {
    await this.client.query(
      `INSERT INTO audit_events(actor_id, entity_type, entity_id, action, before_state, after_state, request_id) VALUES ($1, 'user', $2, $3, $4::jsonb, $5::jsonb, $6)`,
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

  private async requireUser(id: string): Promise<StaffUser> {
    const user = await this.findById(id);
    if (user === null) {
      throw new Error("Missing account in transaction.");
    }
    return user;
  }
}

function requiredRow(row: DatabaseRow | undefined): DatabaseRow {
  if (row === undefined) {
    throw new Error("Missing PostgreSQL account row.");
  }
  return row;
}

function readString(row: DatabaseRow, key: string): string {
  const value = row[key];
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error("Invalid PostgreSQL account field: " + key);
  }
  return value;
}

function readDate(row: DatabaseRow, key: string): Date {
  const value = row[key];
  if (!(value instanceof Date) || Number.isNaN(value.getTime())) {
    throw new Error("Invalid PostgreSQL account field: " + key);
  }
  return value;
}

function parseStaffUser(row: DatabaseRow): StaffUser {
  if (
    !(
      row.name === null ||
      (typeof row.name === "string" && row.name.trim() !== "")
    ) ||
    typeof row.blocked !== "boolean"
  ) {
    throw new Error("Invalid account metadata.");
  }
  const membership = readAccountMemberships(row, "customer");
  return {
    id: readString(row, "id"),
    name: row.name,
    phoneE164: readString(row, "phone_e164"),
    customer: membership.customer,
    employee: membership.employee,
    blocked: row.blocked,
    createdAt: readDate(row, "created_at"),
    updatedAt: readDate(row, "updated_at"),
  };
}

function parseEmployee(row: DatabaseRow): Employee {
  if (
    !(
      row.name === null ||
      (typeof row.name === "string" && row.name.trim() !== "")
    ) ||
    (row.role !== "barista" && row.role !== "administrator") ||
    typeof row.access_enabled !== "boolean" ||
    typeof row.account_blocked !== "boolean"
  ) {
    throw new Error("Invalid employee metadata.");
  }
  return {
    id: readString(row, "id"),
    name: row.name,
    phoneE164: readString(row, "phone_e164"),
    role: row.role,
    accessEnabled: row.access_enabled,
    accountBlocked: row.account_blocked,
    createdAt: readDate(row, "created_at"),
    updatedAt: readDate(row, "updated_at"),
  };
}
