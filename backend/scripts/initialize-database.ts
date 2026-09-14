import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { Pool, type PoolClient } from "pg";
import { validateEnvironment } from "../src/platform/config/environment";

async function hasUserSchemaObjects(client: PoolClient): Promise<boolean> {
  const result = await client.query<{ exists: boolean }>(`
    SELECT EXISTS (
      SELECT 1 FROM pg_class WHERE relnamespace = 'public'::regnamespace
      UNION ALL
      SELECT 1 FROM pg_type WHERE typnamespace = 'public'::regnamespace
        AND typtype <> 'b'
      UNION ALL
      SELECT 1 FROM pg_proc WHERE pronamespace = 'public'::regnamespace
      UNION ALL
      SELECT 1 FROM pg_operator WHERE oprnamespace = 'public'::regnamespace
      UNION ALL
      SELECT 1 FROM pg_collation WHERE collnamespace = 'public'::regnamespace
      UNION ALL
      SELECT 1 FROM pg_conversion WHERE connamespace = 'public'::regnamespace
      UNION ALL
      SELECT 1 FROM pg_opclass WHERE opcnamespace = 'public'::regnamespace
      UNION ALL
      SELECT 1 FROM pg_opfamily WHERE opfnamespace = 'public'::regnamespace
      UNION ALL
      SELECT 1 FROM pg_ts_config WHERE cfgnamespace = 'public'::regnamespace
      UNION ALL
      SELECT 1 FROM pg_ts_dict WHERE dictnamespace = 'public'::regnamespace
      UNION ALL
      SELECT 1 FROM pg_ts_parser WHERE prsnamespace = 'public'::regnamespace
      UNION ALL
      SELECT 1 FROM pg_ts_template WHERE tmplnamespace = 'public'::regnamespace
      UNION ALL
      SELECT 1 FROM pg_statistic_ext WHERE stxnamespace = 'public'::regnamespace
      UNION ALL
      SELECT 1 FROM pg_extension WHERE extnamespace = 'public'::regnamespace
    ) AS exists;
  `);
  return result.rows[0]?.exists ?? false;
}

export async function initializeDatabase(pool: Pool): Promise<void> {
  const client = await pool.connect();
  try {
    if (await hasUserSchemaObjects(client)) {
      throw new Error("Database initialization requires an empty target.");
    }
    const schema = await readFile(resolve(process.cwd(), "schema.sql"), "utf8");
    await client.query("BEGIN");
    try {
      await client.query("SET LOCAL search_path TO public");
      await client.query(
        "CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public",
      );
      await client.query(schema);
      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    }
  } finally {
    client.release();
  }
}

async function main(): Promise<void> {
  validateEnvironment(process.env);
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  try {
    await initializeDatabase(pool);
  } finally {
    await pool.end();
  }
}

void main();
