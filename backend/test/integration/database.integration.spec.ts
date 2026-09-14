import { execFileSync } from "node:child_process";
import { resolve } from "node:path";
import { Pool } from "pg";

const databaseUrl = process.env.DATABASE_URL;
const externalProcessTimeoutMs = 30_000;
const bootstrapAdministratorPhone = "+79991234567";

function runSeed(): void {
  execFileSync("npm", ["run", "seed"], {
    cwd: resolve(__dirname, "../.."),
    env: {
      ...process.env,
      JEST_WORKER_ID: undefined,
      NODE_ENV: "local",
      PORT: "3000",
      DATABASE_URL: databaseUrl,
      BOOTSTRAP_ADMIN_PHONE: bootstrapAdministratorPhone,
      AUTH_ACCESS_TOKEN_SECRET: "example-access-token",
      AUTH_OTP_PEPPER: "database-foundation-otp-pepper",
      AUTH_DEVELOPMENT_OTP: "123456",
      CORS_ORIGINS: "http://localhost:5173",
      VAPID_SUBJECT: "mailto:database@expressa.test",
      VAPID_PUBLIC_KEY:
        "BOT-VsrivTqPsMDCzS45APlNSMbgcTT5jqlrYu2-6PCRGB0YneXQDNsbrIxTAy0jJ-kUlKlWPm94PeirK8A8wCw",
      VAPID_PRIVATE_KEY: "9rZGGVplNbc2psiiiyOla_ZL-qDyrgIZqD_cpLz1G0c",
    },
    stdio: "inherit",
  });
}

describe("PostgreSQL foundation", () => {
  let pool: Pool;

  beforeAll(() => {
    if (databaseUrl === undefined) {
      throw new Error("DATABASE_URL is required for integration tests");
    }
    pool = new Pool({ connectionString: databaseUrl });
  });

  afterAll(async () => {
    await pool?.end();
  });

  it(
    "seeds an initialized current schema idempotently",
    async () => {
      runSeed();
      runSeed();
      const administrators = await pool.query<{
        phone_e164: string;
        role: string;
      }>("SELECT phone_e164, role FROM users WHERE phone_e164 = $1", [
        bootstrapAdministratorPhone,
      ]);
      expect(administrators.rows).toEqual([
        { phone_e164: bootstrapAdministratorPhone, role: "administrator" },
      ]);
    },
    externalProcessTimeoutMs,
  );
});
