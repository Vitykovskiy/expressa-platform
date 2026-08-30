import { execFileSync } from "node:child_process";
import { randomInt, randomUUID } from "node:crypto";
import { resolve } from "node:path";
import { Pool } from "pg";
import { PostgresOrderLifecycleRepository } from "../../src/orders/adapters/postgres-order-lifecycle.repository";

const databaseUrl = process.env.DATABASE_URL;
const externalProcessTimeoutMs = 30_000;

function runMigrations(): void {
  execFileSync("npm", ["run", "migrate"], {
    cwd: resolve(__dirname, "../.."),
    env: {
      ...process.env,
      JEST_WORKER_ID: undefined,
      NODE_ENV: "local",
      PORT: "3000",
      DATABASE_URL: databaseUrl,
      AUTH_ACCESS_TOKEN_SECRET: "order-lifecycle-access-token-secret",
      AUTH_OTP_PEPPER: "order-lifecycle-otp-pepper",
      AUTH_DEVELOPMENT_OTP: "123456",
      CORS_ORIGINS: "http://localhost:5173",
    },
    stdio: "inherit",
  });
}

async function createUser(
  pool: Pool,
  role: "customer" | "barista",
): Promise<{ id: string; phoneE164: string }> {
  const id = randomUUID();
  const phone =
    "+7999" +
    Math.floor(Math.random() * 10_000_000)
      .toString()
      .padStart(7, "0");
  await pool.query(
    "INSERT INTO users (id, phone_e164, role) VALUES ($1, $2, $3)",
    [id, phone, role],
  );
  return { id, phoneE164: phone };
}

async function createOrder(pool: Pool, customerId: string): Promise<string> {
  const id = randomUUID();
  const orderDay = randomInt(2100, 10_000).toString() + "-01-01";
  const dailyNumber = randomInt(1, 1_000);
  const number =
    orderDay.replaceAll("-", "") +
    "-" +
    dailyNumber.toString().padStart(3, "0");
  await pool.query(
    `INSERT INTO orders (
      id, number, customer_id, idempotency_key, request_fingerprint, total, order_day, daily_number
    ) VALUES ($1, $2, $3, $4, $5, 450, $6, $7)`,
    [id, number, customerId, randomUUID(), randomUUID(), orderDay, dailyNumber],
  );
  return id;
}

describe("PostgreSQL lifecycle заказа", () => {
  let pool: Pool;
  let repository: PostgresOrderLifecycleRepository;

  beforeAll(() => {
    if (databaseUrl === undefined) {
      throw new Error("DATABASE_URL is required for integration tests");
    }
    pool = new Pool({ connectionString: databaseUrl });
    repository = new PostgresOrderLifecycleRepository({ pool });
    runMigrations();
  });

  afterAll(async () => {
    await pool?.end();
  });

  it(
    "атомарно проводит только последовательные staff-переходы и сохраняет события",
    async () => {
      const customerId = await createUser(pool, "customer");
      const staffId = await createUser(pool, "barista");
      const orderId = await createOrder(pool, customerId.id);
      const acceptedAt = new Date("2030-01-02T03:04:05.000Z");
      const preparingAt = new Date("2030-01-02T03:04:06.000Z");
      const readyAt = new Date("2030-01-02T03:04:07.000Z");
      const issuedAt = new Date("2030-01-02T03:04:08.000Z");

      await expect(repository.list({ stage: "CREATED" })).resolves.toEqual(
        expect.arrayContaining([
          expect.objectContaining({ id: orderId, stage: "CREATED" }),
        ]),
      );
      await expect(
        repository.transition({
          orderId,
          action: "accept",
          actorId: randomUUID(),
          occurredAt: acceptedAt,
        }),
      ).rejects.toMatchObject({ code: "23503" });
      await expect(
        pool.query("SELECT stage FROM orders WHERE id = $1", [orderId]),
      ).resolves.toMatchObject({ rows: [{ stage: "CREATED" }] });
      await expect(
        pool.query(
          "SELECT count(*)::int AS count FROM order_events WHERE order_id = $1",
          [orderId],
        ),
      ).resolves.toMatchObject({ rows: [{ count: 0 }] });

      await repository.transition({
        orderId,
        action: "accept",
        actorId: staffId.id,
        occurredAt: acceptedAt,
      });
      await expect(
        repository.transition({
          orderId,
          action: "accept",
          actorId: staffId.id,
          occurredAt: acceptedAt,
        }),
      ).rejects.toMatchObject({ code: "ORDER_STAGE_CONFLICT" });
      await repository.transition({
        orderId,
        action: "startPreparing",
        actorId: staffId.id,
        occurredAt: preparingAt,
      });
      await repository.transition({
        orderId,
        action: "markReady",
        actorId: staffId.id,
        occurredAt: readyAt,
      });
      const issued = await repository.transition({
        orderId,
        action: "issue",
        actorId: staffId.id,
        occurredAt: issuedAt,
      });

      expect(issued).toMatchObject({
        id: orderId,
        stage: "ISSUED",
        customer: { id: customerId.id },
        snapshot: [],
      });
      expect(issued.events).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            actorId: staffId.id,
            actorLabel: staffId.phoneE164,
          }),
        ]),
      );
      expect(issued.events.map(({ from, to }) => ({ from, to }))).toEqual([
        { from: "CREATED", to: "ACCEPTED" },
        { from: "ACCEPTED", to: "PREPARING" },
        { from: "PREPARING", to: "READY" },
        { from: "READY", to: "ISSUED" },
      ]);
    },
    externalProcessTimeoutMs,
  );
});
