import type {
  PushSubscription,
  PushSubscriptionCommand,
  PushSubscriptionRepository,
} from "../application/push-notifications.types";
import type {
  DatabaseRow,
  PostgresPushSubscriptionRepositoryDependencies,
} from "./postgres-push-subscription.repository.types";

export class PostgresPushSubscriptionRepository implements PushSubscriptionRepository {
  constructor(
    private readonly dependencies: PostgresPushSubscriptionRepositoryDependencies,
  ) {}

  async upsert(command: PushSubscriptionCommand): Promise<void> {
    await this.dependencies.pool.query(
      `INSERT INTO push_subscriptions (user_id, endpoint, p256dh, auth)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (endpoint) DO UPDATE SET p256dh = EXCLUDED.p256dh, auth = EXCLUDED.auth,
         association_version = gen_random_uuid(), updated_at = CURRENT_TIMESTAMP
       WHERE push_subscriptions.user_id = EXCLUDED.user_id`,
      [command.userId, command.endpoint, command.p256dh, command.auth],
    );
  }

  async delete(userId: string, endpoint: string): Promise<void> {
    const subscription = await this.findByEndpoint(endpoint);
    if (subscription?.userId === userId)
      await this.deleteAssociation(subscription);
  }

  async findByEndpoint(endpoint: string): Promise<PushSubscription | null> {
    const result = await this.dependencies.pool.query<DatabaseRow>(
      `SELECT push_subscriptions.id, user_id, endpoint, p256dh, auth,
              association_version, users.role AS owner_role
       FROM push_subscriptions JOIN users ON users.id = push_subscriptions.user_id
       WHERE endpoint = $1`,
      [endpoint],
    );
    const row = result.rows[0];
    return row === undefined ? null : toSubscription(row);
  }

  async createAssociation(
    command: PushSubscriptionCommand,
  ): Promise<string | null> {
    const result = await this.dependencies.pool.query<DatabaseRow>(
      `INSERT INTO push_subscriptions (user_id, endpoint, p256dh, auth)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (endpoint) DO NOTHING
       RETURNING association_version`,
      [command.userId, command.endpoint, command.p256dh, command.auth],
    );
    const row = result.rows[0];
    return row === undefined ? null : required(row, "association_version");
  }

  async transferAssociation(
    subscription: PushSubscription,
    userId: string,
    expectedVersion: string,
  ): Promise<string | null> {
    const result = await this.dependencies.pool.query<DatabaseRow>(
      `UPDATE push_subscriptions
       SET user_id = $1, association_version = gen_random_uuid(), updated_at = CURRENT_TIMESTAMP
       WHERE id = $2 AND user_id = $3 AND association_version = $4
       RETURNING association_version`,
      [userId, subscription.id, subscription.userId, expectedVersion],
    );
    const row = result.rows[0];
    return row === undefined ? null : required(row, "association_version");
  }

  async deleteAssociation(subscription: PushSubscription): Promise<boolean> {
    const result = await this.dependencies.pool.query(
      `DELETE FROM push_subscriptions
       WHERE id = $1 AND user_id = $2 AND association_version = $3`,
      [subscription.id, subscription.userId, subscription.associationVersion],
    );
    return result.rowCount === 1;
  }

  async deleteSnapshot(subscription: PushSubscription): Promise<void> {
    await this.deleteAssociation(subscription);
  }

  async findForUser(userId: string): Promise<readonly PushSubscription[]> {
    return this.find("WHERE user_id = $1", [userId]);
  }

  async findForStaff(): Promise<readonly PushSubscription[]> {
    return this.find(
      "JOIN users ON users.id = push_subscriptions.user_id WHERE users.role IN ('barista', 'administrator')",
      [],
    );
  }

  private async find(
    clause: string,
    values: string[],
  ): Promise<readonly PushSubscription[]> {
    const result = await this.dependencies.pool.query<DatabaseRow>(
      `SELECT push_subscriptions.id, user_id, endpoint, p256dh, auth, association_version FROM push_subscriptions ${clause}`,
      values,
    );
    return result.rows.map(toSubscription);
  }
}

function toSubscription(row: DatabaseRow): PushSubscription {
  const ownerRole = row.owner_role;
  if (
    ownerRole !== null &&
    ownerRole !== undefined &&
    ownerRole !== "customer" &&
    ownerRole !== "barista" &&
    ownerRole !== "administrator"
  )
    throw new Error("Invalid PostgreSQL push subscription field: owner_role");
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
  if (typeof value !== "string" || value === "")
    throw new Error(`Invalid PostgreSQL push subscription field: ${field}`);
  return value;
}
