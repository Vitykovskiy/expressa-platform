import { Pool } from "pg";

function requireDisposableTestTarget(): void {
  if (process.env.EXPRESSA_TEST_DATABASE !== "1") {
    throw new Error(
      "EXPRESSA_TEST_DATABASE=1 is required to reset a test database.",
    );
  }
  const databaseUrl = process.env.DATABASE_URL;
  if (databaseUrl === undefined) {
    throw new Error("DATABASE_URL is required.");
  }
  const databaseName = new URL(databaseUrl).pathname.slice(1);
  if (!/(?:^|_)test(?:$|_)/.test(databaseName)) {
    throw new Error("Test database name must contain test.");
  }
}

async function main(): Promise<void> {
  requireDisposableTestTarget();
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  try {
    await pool.query("DROP EXTENSION IF EXISTS pgcrypto");
    await pool.query("DROP SCHEMA IF EXISTS public CASCADE");
    await pool.query("CREATE SCHEMA public AUTHORIZATION CURRENT_USER");
  } finally {
    await pool.end();
  }
}

void main();
