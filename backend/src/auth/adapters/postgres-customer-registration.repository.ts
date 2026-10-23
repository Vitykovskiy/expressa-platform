import type { Pool, PoolClient } from "pg";
import type {
  CustomerRegistrationCommand,
  CustomerRegistrationRepository,
  RegisteredAuthUser,
} from "../application/customer-registration.repository.types";
import { AccessDeniedError } from "../domain/auth.errors";
import {
  CustomerRegistrationForbiddenError,
  CustomerRegistrationUnavailableError,
} from "../domain/customer-registration.errors";
import type { CustomerRegistrationRow } from "./postgres-customer-registration.repository.types";

export class PostgresCustomerRegistrationRepository implements CustomerRegistrationRepository {
  constructor(private readonly getPool: () => Pool) {}

  async findCurrentUser(
    sessionId: string,
    now: Date,
  ): Promise<RegisteredAuthUser | null> {
    try {
      const result = await this.getPool().query<CustomerRegistrationRow>(
        `SELECT users.id, users.phone_e164, users.role, users.name
         FROM users JOIN sessions ON sessions.user_id = users.id
         WHERE sessions.id = $1 AND users.blocked_at IS NULL
           AND sessions.revoked_at IS NULL AND sessions.expires_at > $2`,
        [sessionId, now],
      );
      return result.rows[0] === undefined
        ? null
        : this.parseUser(result.rows[0]);
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
      // Общий порядок user → session сохраняет совместимость с блокировкой и refresh.
      const account = await client.query<CustomerRegistrationRow>(
        `SELECT id, phone_e164, role, name, blocked_at FROM users WHERE id = $1 FOR UPDATE`,
        [command.userId],
      );
      const row = account.rows[0];
      if (row === undefined || row.blocked_at !== null) {
        throw new AccessDeniedError();
      }
      const user = this.parseUser(row);
      const session = await client.query<CustomerRegistrationRow>(
        `SELECT id FROM sessions WHERE id = $1 AND user_id = $2
           AND revoked_at IS NULL AND expires_at > $3 FOR UPDATE`,
        [command.sessionId, command.userId, command.now],
      );
      if (session.rows[0] === undefined) {
        throw new AccessDeniedError();
      }
      if (user.role !== "customer") {
        throw new CustomerRegistrationForbiddenError();
      }
      if (user.name !== null) {
        await client.query("COMMIT");
        return user;
      }
      const updated = await client.query<CustomerRegistrationRow>(
        `UPDATE users SET name = $2, updated_at = CURRENT_TIMESTAMP
         WHERE id = $1 AND name IS NULL RETURNING id, phone_e164, role, name`,
        [command.userId, command.name],
      );
      if (updated.rows[0] === undefined) {
        throw new Error("Registration command returned no user.");
      }
      const registered = this.parseUser(updated.rows[0]);
      await client.query("COMMIT");
      return registered;
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
        error instanceof CustomerRegistrationForbiddenError
      ) {
        throw error;
      }
      throw new CustomerRegistrationUnavailableError(error);
    } finally {
      client?.release();
    }
  }

  private parseUser(row: CustomerRegistrationRow): RegisteredAuthUser {
    const { id, phone_e164: phoneE164, role, name } = row;
    if (typeof id !== "string" || typeof phoneE164 !== "string") {
      throw new Error("Invalid registration user identity.");
    }
    if (!(
      role === "customer" ||
      role === "barista" ||
      role === "administrator"
    )) {
      throw new Error("Invalid registration user role.");
    }
    if (!(name === null || (typeof name === "string" && name.trim() !== ""))) {
      throw new Error("Invalid registration user name.");
    }
    return { id, phoneE164, role, name };
  }
}
