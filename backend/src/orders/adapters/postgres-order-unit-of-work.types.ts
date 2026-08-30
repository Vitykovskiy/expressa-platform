import type { Pool, PoolClient } from "pg";

export type DatabaseRow = Record<string, unknown>;

export type PostgresOrderUnitOfWorkDependencies = {
  pool: Pool;
};

export type TransactionClient = PoolClient;
