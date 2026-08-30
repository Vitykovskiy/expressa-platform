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
       ON CONFLICT (endpoint) DO UPDATE SET p256dh = EXCLUDED.p256dh, auth = EXCLUDED.auth, updated_at = CURRENT_TIMESTAMP
       WHERE push_subscriptions.user_id = EXCLUDED.user_id`,
      [command.userId, command.endpoint, command.p256dh, command.auth],
    );
  }

  async delete(userId: string, endpoint: string): Promise<void> {
    await this.dependencies.pool.query(
      "DELETE FROM push_subscriptions WHERE user_id = $1 AND endpoint = $2",
      [userId, endpoint],
    );
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
      `SELECT push_subscriptions.id, user_id, endpoint, p256dh, auth FROM push_subscriptions ${clause}`,
      values,
    );
    return result.rows.map((row) => ({
      id: required(row, "id"),
      userId: required(row, "user_id"),
      endpoint: required(row, "endpoint"),
      p256dh: required(row, "p256dh"),
      auth: required(row, "auth"),
    }));
  }
}

function required(row: DatabaseRow, field: string): string {
  const value = row[field];
  if (typeof value !== "string" || value === "")
    throw new Error(`Invalid PostgreSQL push subscription field: ${field}`);
  return value;
}
