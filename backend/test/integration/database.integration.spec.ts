import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';
import { Pool } from 'pg';

const databaseUrl = process.env.DATABASE_URL;

function runScript(script: 'migrate' | 'seed'): void {
  execFileSync('npm', ['run', script], {
    cwd: resolve(__dirname, '../..'),
    env: {
      ...process.env,
      JEST_WORKER_ID: undefined,
      NODE_ENV: 'local',
      PORT: '3000',
      DATABASE_URL: databaseUrl,
    },
    stdio: 'inherit',
  });
}

describe('PostgreSQL foundation', () => {
  let pool: Pool;

  beforeAll(() => {
    if (databaseUrl === undefined) {
      throw new Error('DATABASE_URL is required for integration tests');
    }

    pool = new Pool({ connectionString: databaseUrl });
  });

  afterAll(async () => {
    await pool?.end();
  });

  it('повторно применяет миграции и пустой seed', async () => {
    runScript('migrate');
    runScript('migrate');
    runScript('seed');
    runScript('seed');

    const result = await pool.query<{ name: string }>(
      'SELECT name FROM schema_migrations ORDER BY name',
    );

    expect(result.rows).toEqual([{ name: '0001_foundation.sql' }]);
  });
});
