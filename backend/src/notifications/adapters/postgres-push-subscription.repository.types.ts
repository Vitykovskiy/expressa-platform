import type { Pool, PoolClient } from "pg";

export type PostgresPushSubscriptionRepositoryDependencies = { pool: Pool };
export type DatabaseRow = Record<string, unknown>;
export type PushQueryable = Pick<PoolClient, "query">;
