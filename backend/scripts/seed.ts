import { Pool } from 'pg';
import { validateEnvironment } from '../src/platform/config/environment';

async function main(): Promise<void> {
  validateEnvironment(process.env);

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  try {
    await pool.query('SELECT 1 FROM schema_migrations LIMIT 1');
  } finally {
    await pool.end();
  }
}

void main();
