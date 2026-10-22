import type {
  PushSubscription,
  PushSubscriptionCommand,
  PushSubscriptionRepository,
} from "../application/push-notifications.types";
import type {
  PushAssociationActor,
  PushAssociationTransaction,
  PushAssociationUnitOfWork,
} from "../application/push-association.types";
import {
  PushAssociationUnauthorizedError,
  PushAssociationAccessDeniedError,
  PushAssociationConflictError,
} from "../application/manage-push-subscription.use-case";
import type {
  DatabaseRow,
  PostgresPushSubscriptionRepositoryDependencies,
  PushQueryable,
} from "./postgres-push-subscription.repository.types";
import type { PoolClient } from "pg";
import { pushSubscriptionProjection } from "./postgres-push-subscription.repository.constants";
import { staffUsersMembershipLock } from "../../staff-users/adapters/staff-users-lock.constants";

export class PostgresPushSubscriptionRepository
  implements PushSubscriptionRepository, PushAssociationUnitOfWork
{
  constructor(
    private readonly dependencies: PostgresPushSubscriptionRepositoryDependencies,
  ) {}

  async run<Result>(
    actor: PushAssociationActor,
    endpoint: string,
    operation: (repository: PushAssociationTransaction) => Promise<Result>,
  ): Promise<Result> {
    this.requireActor(actor, actor.userId);
    const client = await this.dependencies.pool.connect();
    try {
      await client.query("BEGIN");
      // Общая membership-блокировка предшествует users, как у изменения роли/блокировки.
      await client.query(
        "SELECT pg_advisory_xact_lock(hashtextextended($1, 0))",
        [staffUsersMembershipLock],
      );
      const original = await client.query<DatabaseRow>(
        "SELECT user_id FROM push_subscriptions WHERE endpoint = $1",
        [endpoint],
      );
      const ownerId =
        original.rows[0] === undefined
          ? null
          : required(original.rows[0], "user_id");
      const userIds =
        ownerId === null || ownerId === actor.userId
          ? [actor.userId]
          : [actor.userId, ownerId].sort();
      const accounts = await client.query<DatabaseRow>(
        "SELECT id, role, (blocked_at IS NOT NULL) AS blocked FROM users WHERE id = ANY($1::uuid[]) ORDER BY id FOR UPDATE",
        [userIds],
      );
      const account = accounts.rows.find((row) => row.id === actor.userId);
      if (account === undefined || account.blocked === true) {
        throw new PushAssociationUnauthorizedError();
      }
      if (account.blocked !== false) {
        throw new Error("Invalid push account block metadata");
      }
      await this.lockAndAuthorizeSession(client, actor);
      if (account.role !== "customer" && account.role !== "barista") {
        throw new PushAssociationAccessDeniedError();
      }
      if (account.role !== actor.role) {
        throw new PushAssociationUnauthorizedError();
      }
      const locked = await client.query<DatabaseRow>(
        "SELECT user_id FROM push_subscriptions WHERE endpoint = $1 FOR UPDATE",
        [endpoint],
      );
      const lockedOwnerId =
        locked.rows[0] === undefined
          ? null
          : required(locked.rows[0], "user_id");
      if (lockedOwnerId !== null && lockedOwnerId !== ownerId) {
        throw new PushAssociationConflictError();
      }
      const result = await operation(
        new PostgresPushAssociationTransaction(client, actor),
      );
      await client.query("COMMIT");
      return result;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  async findByEndpoint(endpoint: string): Promise<PushSubscription | null> {
    const result = await this.dependencies.pool.query<DatabaseRow>(
      `SELECT ${pushSubscriptionProjection} FROM push_subscriptions JOIN users ON users.id = push_subscriptions.user_id WHERE endpoint = $1`,
      [endpoint],
    );
    return result.rows[0] === undefined ? null : toSubscription(result.rows[0]);
  }

  createAssociation(
    command: PushSubscriptionCommand,
    actor?: PushAssociationActor,
  ): Promise<string | null> {
    return this.run(
      this.requireActor(actor, command.userId),
      command.endpoint,
      (repository) => repository.createAssociation(command),
    );
  }
  transferAssociation(
    subscription: PushSubscription,
    userId: string,
    expectedVersion: string,
    actor?: PushAssociationActor,
  ): Promise<string | null> {
    return this.run(
      this.requireActor(actor, userId),
      subscription.endpoint,
      async (repository) => {
        const current = await repository.findByEndpoint(subscription.endpoint);
        if (
          current === null ||
          current.ownerRole !== "customer" ||
          current.id !== subscription.id ||
          current.userId !== subscription.userId
        ) {
          return null;
        }
        return repository.transferAssociation(
          subscription,
          userId,
          expectedVersion,
        );
      },
    );
  }
  deleteAssociation(
    subscription: PushSubscription,
    actor?: PushAssociationActor,
  ): Promise<boolean> {
    return this.run(
      this.requireActor(actor, subscription.userId),
      subscription.endpoint,
      (repository) => repository.deleteAssociation(subscription),
    );
  }
  async deleteSnapshot(subscription: PushSubscription): Promise<void> {
    await deleteSnapshot(this.dependencies.pool, subscription);
  }
  async findForUser(userId: string): Promise<readonly PushSubscription[]> {
    return this.find("WHERE user_id = $1 AND users.blocked_at IS NULL", [
      userId,
    ]);
  }
  async findForStaff(): Promise<readonly PushSubscription[]> {
    return this.find(
      "WHERE users.role = 'barista' AND users.blocked_at IS NULL",
      [],
    );
  }
  private async find(
    clause: string,
    values: string[],
  ): Promise<readonly PushSubscription[]> {
    const result = await this.dependencies.pool.query<DatabaseRow>(
      `SELECT ${pushSubscriptionProjection} FROM push_subscriptions JOIN users ON users.id = push_subscriptions.user_id ${clause}`,
      values,
    );
    return result.rows.map(toSubscription);
  }
  private requireActor(
    actor: PushAssociationActor | undefined,
    userId: string,
  ): PushAssociationActor {
    if (
      actor === undefined ||
      actor.userId !== userId ||
      actor.sessionId.trim() === ""
    ) {
      throw new PushAssociationUnauthorizedError();
    }
    if (actor.role !== "customer" && actor.role !== "barista") {
      throw new PushAssociationAccessDeniedError();
    }
    return actor;
  }
  private async lockAndAuthorizeSession(
    client: PoolClient,
    actor: PushAssociationActor,
  ): Promise<void> {
    const sessions = await client.query<DatabaseRow>(
      "SELECT id, user_id, revoked_at, expires_at FROM sessions WHERE id = $1 FOR UPDATE",
      [actor.sessionId],
    );
    const session = sessions.rows[0];
    if (
      session === undefined ||
      session.user_id !== actor.userId ||
      session.revoked_at !== null
    ) {
      throw new PushAssociationUnauthorizedError();
    }
    const clock = await client.query<DatabaseRow>(
      "SELECT clock_timestamp() AS now",
    );
    const now = clock.rows[0]?.now;
    if (
      !(now instanceof Date) ||
      Number.isNaN(now.getTime()) ||
      !(session.expires_at instanceof Date) ||
      Number.isNaN(session.expires_at.getTime())
    ) {
      throw new Error("Invalid push authorization timestamps");
    }
    if (session.expires_at <= now) {
      throw new PushAssociationUnauthorizedError();
    }
  }
}

class PostgresPushAssociationTransaction implements PushAssociationTransaction {
  constructor(
    private readonly client: PoolClient,
    private readonly actor: PushAssociationActor,
  ) {}
  async findByEndpoint(endpoint: string): Promise<PushSubscription | null> {
    const result = await this.client.query<DatabaseRow>(
      `SELECT ${pushSubscriptionProjection} FROM push_subscriptions JOIN users ON users.id = push_subscriptions.user_id WHERE endpoint = $1`,
      [endpoint],
    );
    return result.rows[0] === undefined ? null : toSubscription(result.rows[0]);
  }
  async createAssociation(
    command: PushSubscriptionCommand,
  ): Promise<string | null> {
    if (command.userId !== this.actor.userId) {
      throw new PushAssociationUnauthorizedError();
    }
    const result = await this.client.query<DatabaseRow>(
      `INSERT INTO push_subscriptions(user_id, endpoint, p256dh, auth) VALUES ($1, $2, $3, $4) ON CONFLICT (endpoint) DO NOTHING RETURNING association_version`,
      [command.userId, command.endpoint, command.p256dh, command.auth],
    );
    return result.rows[0] === undefined
      ? null
      : required(result.rows[0], "association_version");
  }
  async transferAssociation(
    subscription: PushSubscription,
    userId: string,
    expectedVersion: string,
  ): Promise<string | null> {
    if (userId !== this.actor.userId) {
      throw new PushAssociationUnauthorizedError();
    }
    if (subscription.userId !== userId && this.actor.role !== "customer") {
      throw new PushAssociationConflictError();
    }
    const result = await this.client.query<DatabaseRow>(
      `UPDATE push_subscriptions SET user_id = $1, association_version = gen_random_uuid(), updated_at = CURRENT_TIMESTAMP
       WHERE id = $2 AND user_id = $3 AND association_version = $4
         AND EXISTS (SELECT 1 FROM users WHERE users.id = push_subscriptions.user_id AND users.role = 'customer')
       RETURNING association_version`,
      [userId, subscription.id, subscription.userId, expectedVersion],
    );
    return result.rows[0] === undefined
      ? null
      : required(result.rows[0], "association_version");
  }
  deleteAssociation(subscription: PushSubscription): Promise<boolean> {
    if (subscription.userId !== this.actor.userId) {
      throw new PushAssociationConflictError();
    }
    return deleteSnapshot(this.client, subscription);
  }
}

async function deleteSnapshot(
  client: PushQueryable,
  subscription: PushSubscription,
): Promise<boolean> {
  const result = await client.query(
    "DELETE FROM push_subscriptions WHERE id = $1 AND user_id = $2 AND association_version = $3",
    [subscription.id, subscription.userId, subscription.associationVersion],
  );
  return result.rowCount === 1;
}

function toSubscription(row: DatabaseRow): PushSubscription {
  const ownerRole = row.owner_role;
  if (
    ownerRole !== null &&
    ownerRole !== undefined &&
    ownerRole !== "customer" &&
    ownerRole !== "barista" &&
    ownerRole !== "administrator"
  ) {
    throw new Error("Invalid PostgreSQL push subscription field: owner_role");
  }
  return {
    id: required(row, "id"),
    userId: required(row, "user_id"),
    endpoint: required(row, "endpoint"),
    p256dh: required(row, "p256dh"),
    auth: required(row, "auth"),
    associationVersion: required(row, "association_version"),
    ...(ownerRole === undefined || ownerRole === null ? {} : { ownerRole }),
  };
}

function required(row: DatabaseRow, field: string): string {
  const value = row[field];
  if (typeof value !== "string" || value === "") {
    throw new Error(`Invalid PostgreSQL push subscription field: ${field}`);
  }
  return value;
}
