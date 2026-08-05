import { execFileSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { resolve } from 'node:path';
import { Pool } from 'pg';
import { catalogSeed } from '../../scripts/seed.constants';
import { PostgresOrderUnitOfWork } from '../../src/orders/adapters/postgres-order-unit-of-work';
import { catalogAdvisoryLockKey, catalogCommandAdvisoryLockSql } from '../../src/catalog/adapters/catalog-advisory-lock.constants';
import type { OrderRequest } from '../../src/orders/domain/order.types';

const databaseUrl = process.env.DATABASE_URL;
const externalProcessTimeoutMs = 30_000;

function runScript(script: 'migrate' | 'seed'): void {
  execFileSync('npm', ['run', script], {
    cwd: resolve(__dirname, '../..'),
    env: {
      ...process.env,
      JEST_WORKER_ID: undefined,
      NODE_ENV: 'local',
      PORT: '3000',
      DATABASE_URL: databaseUrl,
      AUTH_ACCESS_TOKEN_SECRET: 'order-unit-of-work-access-token-secret',
      AUTH_OTP_PEPPER: 'order-unit-of-work-otp-pepper',
      AUTH_DEVELOPMENT_OTP: '123456',
      CORS_ORIGINS: 'http://localhost:5173',
    },
    stdio: 'inherit',
  });
}

async function createCustomer(pool: Pool): Promise<string> {
  const id = randomUUID();
  const phone = '+7999' + Math.floor(Math.random() * 10_000_000).toString().padStart(7, '0');
  await pool.query('INSERT INTO users (id, phone_e164) VALUES ($1, $2)', [id, phone]);
  return id;
}

function createRequest(): OrderRequest {
  const cappuccino = catalogSeed.products[0]!;
  const medium = catalogSeed.productVariants[1]!;
  const regularMilk = catalogSeed.modifierOptions[0]!;
  return {
    totalMinor: 32_000,
    items: [{ productId: cappuccino.id, variantId: medium.id, modifierOptionIds: [regularMilk.id], quantity: 1 }],
  };
}

describe('PostgreSQL unit of work заказа', () => {
  let pool: Pool;
  let unitOfWork: PostgresOrderUnitOfWork;

  beforeAll(() => {
    if (databaseUrl === undefined) {
      throw new Error('DATABASE_URL is required for integration tests');
    }
    pool = new Pool({ connectionString: databaseUrl });
    unitOfWork = new PostgresOrderUnitOfWork({ pool });
    runScript('migrate');
    runScript('seed');
  });

  afterAll(async () => {
    await pool?.end();
  });

  beforeEach(() => {
    runScript('seed');
  });

  it(
    'создаёт атомарный снимок и возвращает неизменный replay до повторной проверки каталога',
    async () => {
      const customerId = await createCustomer(pool);
      const idempotencyKey = randomUUID();
      const request = createRequest();
      const created = await unitOfWork.createOrder({ customerId, idempotencyKey, request, now: new Date('2031-02-03T23:59:59.000Z') });

      expect(created).toMatchObject({ replayed: false, order: { totalMinor: 32_000 } });
      expect(created.order.number).toMatch(/^20310203-\d{3}$/);
      await pool.query('UPDATE products SET name = $1, is_available = false WHERE id = $2', ['Новое имя', request.items[0]!.productId]);

      await expect(unitOfWork.createOrder({ customerId, idempotencyKey, request, now: new Date('2031-02-04T00:00:00.000Z') })).resolves.toEqual({
        replayed: true,
        order: created.order,
      });
    },
    externalProcessTimeoutMs,
  );

  it('сохраняет порядок нескольких позиций и добавок одинаково для initial и replay', async () => {
    await pool.query(`UPDATE modifier_groups SET selection_type = 'multiple', max_select = 2 WHERE id = $1`, [catalogSeed.modifierGroups[0]!.id]);
    const customerId = await createCustomer(pool);
    const request: OrderRequest = {
      totalMinor: 62_000,
      items: [
        { productId: catalogSeed.products[0]!.id, variantId: catalogSeed.productVariants[1]!.id, modifierOptionIds: [catalogSeed.modifierOptions[1]!.id, catalogSeed.modifierOptions[0]!.id], quantity: 1 },
        { productId: catalogSeed.products[2]!.id, variantId: null, modifierOptionIds: [], quantity: 1 },
      ],
    };
    const command = { customerId, idempotencyKey: randomUUID(), request, now: new Date('2032-01-01T00:00:00Z') };
    const created = await unitOfWork.createOrder(command);
    const replay = await unitOfWork.createOrder(command);
    expect(created.order).toEqual(replay.order);
    expect(created.order.items.map((item) => item.productId)).toEqual(request.items.map((item) => item.productId));
    expect(created.order.items[0]!.modifiers.map((item) => item.modifierOptionId)).toEqual(request.items[0]!.modifierOptionIds);
  }, externalProcessTimeoutMs);

  it('разделяет одинаковый idempotency key между customer', async () => {
    const key = randomUUID();
    const request = createRequest();
    const [firstCustomerId, secondCustomerId] = await Promise.all([createCustomer(pool), createCustomer(pool)]);
    const first = await unitOfWork.createOrder({ customerId: firstCustomerId, idempotencyKey: key, request, now: new Date('2032-01-02T00:00:00Z') });
    const second = await unitOfWork.createOrder({ customerId: secondCustomerId, idempotencyKey: key, request, now: new Date('2032-01-02T00:00:00Z') });
    expect(first.order.id).not.toBe(second.order.id);
  }, externalProcessTimeoutMs);

  it('после exclusive catalog lock читает новое состояние', async () => {
    const customerId = await createCustomer(pool);
    const writer = await pool.connect();
    try {
      await writer.query('BEGIN');
      await writer.query(catalogCommandAdvisoryLockSql, [catalogAdvisoryLockKey]);
      await writer.query('UPDATE products SET is_available = false WHERE id = $1', [catalogSeed.products[0]!.id]);
      const creation = unitOfWork.createOrder({ customerId, idempotencyKey: randomUUID(), request: createRequest(), now: new Date('2032-01-03T00:00:00Z') });
      await new Promise((resolve) => setTimeout(resolve, 50));
      await writer.query('COMMIT');
      await expect(creation).rejects.toThrow('Позиция меню недоступна.');
    } finally { writer.release(); }
  }, externalProcessTimeoutMs);

  it('выдаёт уникальные номера конкурентно, отклоняет cap и откатывает counter при ошибке снимка', async () => {
    const now = new Date('2032-01-04T00:00:00Z');
    const request = createRequest();
    const customers = await Promise.all([createCustomer(pool), createCustomer(pool), createCustomer(pool)]);
    const results = await Promise.all(customers.map((customerId) => unitOfWork.createOrder({ customerId, idempotencyKey: randomUUID(), request, now })));
    expect(new Set(results.map((result) => result.order.number)).size).toBe(3);
    await pool.query(`INSERT INTO order_daily_counters (order_day, last_number) VALUES ('2032-01-05', 999) ON CONFLICT (order_day) DO UPDATE SET last_number = 999`);
    await expect(unitOfWork.createOrder({ customerId: await createCustomer(pool), idempotencyKey: randomUUID(), request, now: new Date('2032-01-05T00:00:00Z') })).rejects.toThrow('daily order number');
    await pool.query(`CREATE FUNCTION fail_order_snapshot() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'snapshot failure'; END; $$`);
    await pool.query(`CREATE TRIGGER fail_order_snapshot BEFORE INSERT ON order_items FOR EACH ROW EXECUTE FUNCTION fail_order_snapshot()`);
    const failedCustomerId = await createCustomer(pool);
    const failedKey = randomUUID();
    await expect(unitOfWork.createOrder({ customerId: failedCustomerId, idempotencyKey: failedKey, request, now: new Date('2032-01-06T00:00:00Z') })).rejects.toThrow('snapshot failure');
    await expect(pool.query(`SELECT count(*)::int AS count FROM orders WHERE customer_id = $1 AND idempotency_key = $2`, [failedCustomerId, failedKey])).resolves.toMatchObject({ rows: [{ count: 0 }] });
    await expect(pool.query(`SELECT count(*)::int AS count FROM order_daily_counters WHERE order_day = '2032-01-06'`)).resolves.toMatchObject({ rows: [{ count: 0 }] });
    await pool.query('DROP TRIGGER fail_order_snapshot ON order_items');
    await pool.query('DROP FUNCTION fail_order_snapshot()');
  }, externalProcessTimeoutMs);

  it(
    'сериализует одинаковый ключ и отклоняет другой fingerprint без нового номера',
    async () => {
      await pool.query('UPDATE products SET is_available = true WHERE id = $1', [catalogSeed.products[0]!.id]);
      const customerId = await createCustomer(pool);
      const idempotencyKey = randomUUID();
      const request = createRequest();
      const command = { customerId, idempotencyKey, request, now: new Date('2031-02-04T00:00:00.000Z') };
      const [first, second] = await Promise.all([unitOfWork.createOrder(command), unitOfWork.createOrder(command)]);

      expect([first.replayed, second.replayed].sort()).toEqual([false, true]);
      expect(first.order).toEqual(second.order);
      await expect(unitOfWork.createOrder({ ...command, request: { ...request, totalMinor: 32_001 } })).rejects.toThrow(
        'Ключ идемпотентности уже использован с другим запросом.',
      );
      await expect(pool.query('SELECT count(*)::int AS count FROM orders WHERE customer_id = $1', [customerId])).resolves.toMatchObject({ rows: [{ count: 1 }] });
    },
    externalProcessTimeoutMs,
  );
});
