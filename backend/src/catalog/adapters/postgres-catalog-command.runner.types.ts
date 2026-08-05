import type { PoolClient } from 'pg';

export type CatalogCommand<Result> = (client: PoolClient) => Promise<Result>;

export type CatalogCommandAudit<Result> = (client: PoolClient, result: Result) => Promise<void>;
