import type { Pool, PoolClient } from "pg";
import type {
  CustomerRegistrationCommand,
  CustomerRegistrationRepository,
  RegisteredAuthUser,
} from "../application/customer-registration.repository.types";
import { AccessDeniedError } from "../domain/auth.errors";
import {
  CustomerRegistrationForbiddenError,
  CustomerRegistrationNameConflictError,
  CustomerRegistrationUnavailableError,
} from "../domain/customer-registration.errors";
import type { CustomerRegistrationRow } from "./postgres-customer-registration.repository.types";
import {
  accountMembershipColumns,
  accountMembershipJoins,
} from "./account-membership.constants";
import { readAccountMemberships, readAuthContext } from "./account-membership";

export class PostgresCustomerRegistrationRepository implements CustomerRegistrationRepository {
  constructor(private readonly getPool: () => Pool) {}

  async findCurrentUser(
    sessionId: string,
    now: Date,
  ): Promise<RegisteredAuthUser | null> {
    try {
      const result = await this.getPool().query<CustomerRegistrationRow>(
        `SELECT users.id, users.phone_e164, users.name, sessions.context, ${accountMembershipColumns}
         FROM users JOIN sessions ON sessions.user_id = users.id ${accountMembershipJoins}
         WHERE sessions.id = $1 AND users.blocked_at IS NULL
           AND sessions.revoked_at IS NULL AND sessions.expires_at > $2`,
        [sessionId, now],
      );
      return result.rows[0] === undefined ? null : parseUser(result.rows[0]);
    } catch (error) {
      throw new CustomerRegistrationUnavailableError(error);
    }
  }

  async complete(
    command: CustomerRegistrationCommand,
  ): Promise<RegisteredAuthUser> {
    let client: PoolClient | undefined;
    try {
      client = await this.getPool().connect();
      await client.query("BEGIN");
      // Account lock сериализует регистрацию и staff-изменения имени/участия.
      const account = await client.query<CustomerRegistrationRow>(
        "SELECT id, name, blocked_at FROM users WHERE id = $1 FOR UPDATE",
        [command.userId],
      );
      const row = account.rows[0];
      if (row === undefined || row.blocked_at !== null) {
        throw new AccessDeniedError();
      }
      const customers = await client.query<CustomerRegistrationRow>(
        "SELECT user_id FROM customers WHERE user_id = $1 FOR UPDATE",
        [command.userId],
      );
      const session = await client.query<CustomerRegistrationRow>(
        `SELECT context, expires_at FROM sessions WHERE id = $1 AND user_id = $2
         AND revoked_at IS NULL FOR UPDATE`,
        [command.sessionId, command.userId],
      );
      if (session.rows[0] === undefined) {
        throw new AccessDeniedError();
      }
      // Время запроса устаревает при ожидании блокировок; проверяем wall clock после session lock.
      const clock = await client.query<CustomerRegistrationRow>(
        "SELECT clock_timestamp() AS now",
      );
      const now = clock.rows[0]?.now;
      const expiresAt = session.rows[0].expires_at;
      if (
        !(now instanceof Date) ||
        Number.isNaN(now.getTime()) ||
        !(expiresAt instanceof Date) ||
        Number.isNaN(expiresAt.getTime())
      ) {
        throw new Error("Invalid registration authorization timestamps.");
      }
      if (expiresAt <= now) {
        throw new AccessDeniedError();
      }
      if (readAuthContext(session.rows[0].context) !== "customer") {
        throw new CustomerRegistrationForbiddenError();
      }
      // Завершённая регистрация идемпотентна и при отличающемся повторном имени.
      if (customers.rows.length === 0) {
        if (row.name !== null && row.name !== command.name) {
          throw new CustomerRegistrationNameConflictError();
        }
        if (row.name === null) {
          await client.query(
            "UPDATE users SET name = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $1",
            [command.userId, command.name],
          );
        }
        await client.query("INSERT INTO customers(user_id) VALUES ($1)", [
          command.userId,
        ]);
      }
      const profile = await client.query<CustomerRegistrationRow>(
        `SELECT users.id, users.phone_e164, users.name, 'customer' AS context, ${accountMembershipColumns}
         FROM users ${accountMembershipJoins} WHERE users.id = $1`,
        [command.userId],
      );
      if (profile.rows[0] === undefined) {
        throw new Error("Missing registered account.");
      }
      const user = parseUser(profile.rows[0]);
      await client.query("COMMIT");
      return user;
    } catch (error) {
      if (client !== undefined) {
        try {
          await client.query("ROLLBACK");
        } catch (rollbackError) {
          throw new CustomerRegistrationUnavailableError(
            new AggregateError(
              [error, rollbackError],
              "Registration rollback failed.",
            ),
          );
        }
      }
      if (
        error instanceof AccessDeniedError ||
        error instanceof CustomerRegistrationForbiddenError ||
        error instanceof CustomerRegistrationNameConflictError
      ) {
        throw error;
      }
      throw new CustomerRegistrationUnavailableError(error);
    } finally {
      client?.release();
    }
  }
}

function parseUser(row: CustomerRegistrationRow): RegisteredAuthUser {
  const { id, phone_e164: phoneE164, name } = row;
  if (
    typeof id !== "string" ||
    typeof phoneE164 !== "string" ||
    !(name === null || (typeof name === "string" && name.trim() !== ""))
  ) {
    throw new Error("Invalid account profile.");
  }
  const memberships = readAccountMemberships(row, readAuthContext(row.context));
  if (memberships.customer !== null && name === null) {
    throw new Error("Registered customer has no canonical name.");
  }
  return { id, phoneE164, name, ...memberships };
}
