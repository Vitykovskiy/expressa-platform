import { createHash } from 'node:crypto';
import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { Pool, PoolClient } from 'pg';

const migrationFilePattern = /^\d{4}_[a-z0-9_]+\.sql$/;

interface Migration {
  name: string;
  checksum: string;
  sql: string;
}

interface AppliedMigration {
  name: string;
  checksum: string;
}

async function readMigrations(directory: string): Promise<Migration[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const names = entries
    .filter((entry) => entry.isFile() && migrationFilePattern.test(entry.name))
    .map((entry) => entry.name)
    .sort();

  return Promise.all(
    names.map(async (name) => {
      const sql = await readFile(join(directory, name), 'utf8');

      return {
        name,
        checksum: createHash('sha256').update(sql).digest('hex'),
        sql,
      };
    }),
  );
}

async function ensureMigrationTable(client: PoolClient): Promise<void> {
  await client.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      name text PRIMARY KEY,
      checksum text NOT NULL,
      applied_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

async function applyMigration(
  client: PoolClient,
  migration: Migration,
): Promise<void> {
  await client.query('BEGIN');

  try {
    await client.query(migration.sql);
    await client.query(
      'INSERT INTO schema_migrations (name, checksum) VALUES ($1, $2)',
      [migration.name, migration.checksum],
    );
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  }
}

export async function migrateDatabase(
  pool: Pool,
  migrationsDirectory: string,
): Promise<void> {
  const client = await pool.connect();

  try {
    await ensureMigrationTable(client);

    const appliedResult = await client.query<AppliedMigration>(
      'SELECT name, checksum FROM schema_migrations',
    );
    const appliedMigrations = new Map(
      appliedResult.rows.map((migration) => [migration.name, migration.checksum]),
    );

    for (const migration of await readMigrations(migrationsDirectory)) {
      const appliedChecksum = appliedMigrations.get(migration.name);

      if (appliedChecksum === undefined) {
        await applyMigration(client, migration);
        continue;
      }

      if (appliedChecksum !== migration.checksum) {
        throw new Error(`Migration checksum mismatch: ${migration.name}`);
      }
    }
  } finally {
    client.release();
  }
}
