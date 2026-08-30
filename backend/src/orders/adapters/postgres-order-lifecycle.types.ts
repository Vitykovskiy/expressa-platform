import type { Pool, PoolClient } from "pg";

export type DatabaseRow = Record<string, unknown>;
export type PostgresOrderLifecycleDependencies = { pool: Pool };
export type TransactionClient = PoolClient;
