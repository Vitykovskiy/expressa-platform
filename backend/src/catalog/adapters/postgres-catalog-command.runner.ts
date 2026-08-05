import type { Pool } from 'pg';
import {
  catalogAdvisoryLockKey,
  catalogCommandAdvisoryLockSql,
} from './catalog-advisory-lock.constants';
import type {
  CatalogCommand,
  CatalogCommandAudit,
} from './postgres-catalog-command.runner.types';

export class PostgresCatalogCommandRunner {
  constructor(private readonly pool: Pool) {}

  async run<Result>(command: CatalogCommand<Result>, audit: CatalogCommandAudit<Result>): Promise<Result> {
    const client = await this.pool.connect();

    try {
      await client.query('BEGIN');
      await client.query(catalogCommandAdvisoryLockSql, [catalogAdvisoryLockKey]);

      const result = await command(client);
      await audit(client, result);

      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}
