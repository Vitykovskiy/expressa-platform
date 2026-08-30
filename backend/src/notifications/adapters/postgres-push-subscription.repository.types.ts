import type { Pool } from "pg";

export type PostgresPushSubscriptionRepositoryDependencies = { pool: Pool };
type DatabaseValue = string | null;
export type DatabaseRow = Record<string, DatabaseValue>;
