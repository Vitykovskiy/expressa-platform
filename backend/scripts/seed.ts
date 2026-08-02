import { Pool } from 'pg';
import { validateEnvironment } from '../src/platform/config/environment';

async function main(): Promise<void> {
  validateEnvironment(process.env);

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  try {
    await pool.query('SELECT 1 FROM schema_migrations LIMIT 1');
    const phone = process.env.BOOTSTRAP_ADMIN_PHONE;
    if (phone !== undefined && phone !== '') {
      await pool.query(
        `INSERT INTO users (phone_e164, role) VALUES ($1, 'administrator')
         ON CONFLICT (phone_e164) DO UPDATE
         SET role = EXCLUDED.role, updated_at = CURRENT_TIMESTAMP`,
        [phone],
      );
    }
  } finally {
    await pool.end();
  }
}

void main();
