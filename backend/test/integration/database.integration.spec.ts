import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';
import { Pool } from 'pg';

const databaseUrl = process.env.DATABASE_URL;
const externalProcessTimeoutMs = 30_000;
const bootstrapAdministratorPhone = '+79991234567';

function runScript(script: 'migrate' | 'seed'): void {
  execFileSync('npm', ['run', script], {
    cwd: resolve(__dirname, '../..'),
    env: {
      ...process.env,
      JEST_WORKER_ID: undefined,
      NODE_ENV: 'local',
      PORT: '3000',
      DATABASE_URL: databaseUrl,
      BOOTSTRAP_ADMIN_PHONE: bootstrapAdministratorPhone,
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

  it(
    'повторно применяет миграции и idempotent seed администратора',
    async () => {
      runScript('migrate');
      runScript('migrate');
      runScript('seed');
      runScript('seed');

      const migrations = await pool.query<{ name: string }>(
        'SELECT name FROM schema_migrations ORDER BY name',
      );
      const administrators = await pool.query<{ phone_e164: string; role: string }>(
        'SELECT phone_e164, role FROM users WHERE phone_e164 = $1',
        [bootstrapAdministratorPhone],
      );

      expect(migrations.rows).toEqual([
        { name: '0001_foundation.sql' },
        { name: '0002_e01_core_schema.sql' },
        { name: '0003_e04_auth.sql' },
        { name: '0004_e05_catalog.sql' },
        { name: '0005_e06_catalog_admin.sql' },
        { name: '0006_e07_orders.sql' },
        { name: '0007_e08_order_lifecycle.sql' },
      ]);
      expect(administrators.rows).toEqual([
        { phone_e164: bootstrapAdministratorPhone, role: 'administrator' },
      ]);
    },
    externalProcessTimeoutMs,
  );
});
