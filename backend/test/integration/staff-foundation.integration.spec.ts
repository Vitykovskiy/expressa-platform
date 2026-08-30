import { execFileSync } from "node:child_process";
import { resolve } from "node:path";
import { Pool } from "pg";

const databaseUrl = process.env.DATABASE_URL;
const externalProcessTimeoutMs = 30_000;

function runStaff(...arguments_: string[]): void {
  execFileSync("npm", ["run", "staff", "--", ...arguments_], {
    cwd: resolve(__dirname, "../.."),
    env: {
      ...process.env,
      JEST_WORKER_ID: undefined,
      NODE_ENV: "local",
      PORT: "3000",
      DATABASE_URL: databaseUrl,
    },
    stdio: "pipe",
  });
}

function runMigrations(): void {
  execFileSync("npm", ["run", "migrate"], {
    cwd: resolve(__dirname, "../.."),
    env: {
      ...process.env,
      JEST_WORKER_ID: undefined,
      NODE_ENV: "local",
      PORT: "3000",
      DATABASE_URL: databaseUrl,
    },
    stdio: "pipe",
  });
}

function expectUsageExit(...arguments_: string[]): void {
  try {
    runStaff(...arguments_);
  } catch (error) {
    expect(error).toMatchObject({ status: 2 });
    return;
  }

  throw new Error("Expected staff CLI to reject invalid arguments");
}

describe("staff foundation CLI", () => {
  let pool: Pool;

  beforeAll(() => {
    if (databaseUrl === undefined) {
      throw new Error("DATABASE_URL is required for integration tests");
    }

    pool = new Pool({ connectionString: databaseUrl });
    runMigrations();
  });

  afterAll(async () => {
    await pool?.end();
  });

  it(
    "создаёт и обновляет допустимые роли",
    async () => {
      const phone = "+79991234568";
      const reversedPhone = "+79991234569";
      const customerPhone = "+79991234570";
      runStaff("upsert", "--phone", phone, "--role", "barista");
      runStaff("upsert", "--phone", phone, "--role", "administrator");
      runStaff("upsert", "--role", "barista", "--phone", reversedPhone);
      runStaff("upsert", "--phone", customerPhone, "--role", "customer");

      const result = await pool.query<{ role: string }>(
        "SELECT role FROM users WHERE phone_e164 = $1",
        [phone],
      );
      expect(result.rows).toEqual([{ role: "administrator" }]);

      const reversedResult = await pool.query<{ role: string }>(
        "SELECT role FROM users WHERE phone_e164 = $1",
        [reversedPhone],
      );
      expect(reversedResult.rows).toEqual([{ role: "barista" }]);

      const customerResult = await pool.query<{ role: string }>(
        "SELECT role FROM users WHERE phone_e164 = $1",
        [customerPhone],
      );
      expect(customerResult.rows).toEqual([{ role: "customer" }]);

      expectUsageExit("upsert", "--phone", phone, "--role", "guest");
      expectUsageExit("remove", "--phone", phone, "--role", "barista");
      expectUsageExit(
        "upsert",
        "--phone",
        phone,
        "--role",
        "barista",
        "--unknown",
        "x",
      );
      expectUsageExit("upsert", "--phone", phone, "--phone", phone);
      expectUsageExit("upsert", "--role", "barista", "--role", "administrator");
      expectUsageExit("upsert", "--phone", "--role", "barista");
      expectUsageExit("upsert", "--phone", phone, "--role");
    },
    externalProcessTimeoutMs,
  );
});
