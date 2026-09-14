import { randomUUID } from "node:crypto";
import { Pool } from "pg";

const databaseUrl = process.env.DATABASE_URL;
const externalProcessTimeoutMs = 30_000;

describe("схема авторизации", () => {
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
    "сохраняет только одну неиспользованную отправленную OTP-задачу на номер",
    async () => {
      const phone =
        "+7999" +
        Math.floor(Math.random() * 1_000_0000)
          .toString()
          .padStart(7, "0");
      const expiresAt = new Date(Date.now() + 5 * 60_000);

      const first = await pool.query<{ id: string }>(
        `INSERT INTO otp_challenges (phone_e164, code_hash, expires_at)
         VALUES ($1, $2, $3)
         RETURNING id`,
        [phone, randomUUID(), expiresAt],
      );
      const firstChallenge = first.rows[0];

      if (firstChallenge === undefined) {
        throw new Error("OTP challenge was not created");
      }

      await expect(
        pool.query(
          `INSERT INTO otp_challenges (phone_e164, code_hash, expires_at)
           VALUES ($1, $2, $3)`,
          [phone, randomUUID(), expiresAt],
        ),
      ).rejects.toMatchObject({ code: "23505" });

      await pool.query(
        "UPDATE otp_challenges SET consumed_at = CURRENT_TIMESTAMP WHERE id = $1",
        [firstChallenge.id],
      );

      await expect(
        pool.query(
          `INSERT INTO otp_challenges (phone_e164, code_hash, expires_at, attempts)
           VALUES ($1, $2, $3, 6)`,
          [phone, randomUUID(), expiresAt],
        ),
      ).rejects.toMatchObject({ code: "23514" });

      await expect(
        pool.query(
          `INSERT INTO otp_challenges (phone_e164, code_hash, expires_at, sent_at)
           VALUES ($1, $2, $3, $4)`,
          [phone, randomUUID(), new Date(Date.now() - 1), new Date()],
        ),
      ).rejects.toMatchObject({ code: "23514" });
    },
    externalProcessTimeoutMs,
  );

  it(
    "защищает сессию внешним ключом и уникальным хешем refresh token",
    async () => {
      const phone =
        "+7999" +
        Math.floor(Math.random() * 1_000_0000)
          .toString()
          .padStart(7, "0");
      const tokenHash = randomUUID();
      const expiresAt = new Date(Date.now() + 60 * 60_000);
      const user = await pool.query<{ id: string }>(
        `INSERT INTO users (phone_e164) VALUES ($1) RETURNING id`,
        [phone],
      );
      const createdUser = user.rows[0];

      if (createdUser === undefined) {
        throw new Error("User was not created");
      }

      await pool.query(
        `INSERT INTO sessions (user_id, refresh_token_hash, expires_at)
         VALUES ($1, $2, $3)`,
        [createdUser.id, tokenHash, expiresAt],
      );

      await expect(
        pool.query(
          `INSERT INTO sessions (user_id, refresh_token_hash, expires_at)
           VALUES ($1, $2, $3)`,
          [createdUser.id, tokenHash, expiresAt],
        ),
      ).rejects.toMatchObject({ code: "23505" });

      await expect(
        pool.query("DELETE FROM users WHERE id = $1", [createdUser.id]),
      ).rejects.toMatchObject({
        code: "23503",
      });
    },
    externalProcessTimeoutMs,
  );
});
