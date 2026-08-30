import { resolve } from "node:path";
import { Pool } from "pg";
import { validateEnvironment } from "../src/platform/config/environment";
import { migrateDatabase } from "../src/platform/database/migrations";

async function main(): Promise<void> {
  validateEnvironment(process.env);

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  try {
    await migrateDatabase(pool, resolve(process.cwd(), "migrations"));
  } finally {
    await pool.end();
  }
}

void main();
