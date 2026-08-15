import { execFileSync } from 'node:child_process';
import { randomInt, randomUUID } from 'node:crypto';
import { resolve } from 'node:path';
import { Pool } from 'pg';
import { PostgresPushSubscriptionRepository } from '../../src/notifications/adapters/postgres-push-subscription.repository';

const databaseUrl = process.env.DATABASE_URL;
const externalProcessTimeoutMs = 30_000;

function runMigrations(): void {
  execFileSync('npm', ['run', 'migrate'], {
    cwd: resolve(__dirname, '../..'),
    env: {
      ...process.env,
      JEST_WORKER_ID: undefined,
      NODE_ENV: 'local',
      PORT: '3000',
      DATABASE_URL: databaseUrl,
      AUTH_ACCESS_TOKEN_SECRET: 'orders-schema-access-token-secret',
      AUTH_OTP_PEPPER: 'orders-schema-otp-pepper',
      AUTH_DEVELOPMENT_OTP: '123456',
      CORS_ORIGINS: 'http://localhost:5173',
      VAPID_SUBJECT: 'mailto:push@expressa.test',
      VAPID_PUBLIC_KEY: 'BOT-VsrivTqPsMDCzS45APlNSMbgcTT5jqlrYu2-6PCRGB0YneXQDNsbrIxTAy0jJ-kUlKlWPm94PeirK8A8wCw',
      VAPID_PRIVATE_KEY: '9rZGGVplNbc2psiiiyOla_ZL-qDyrgIZqD_cpLz1G0c',
    },
    stdio: 'inherit',
  });
}

function createOrderNumber(orderDay: string, dailyNumber: number): string {
  return orderDay.replaceAll('-', '') + '-' + dailyNumber.toString().padStart(3, '0');
}

function createOrderDay(day: string): string {
  return randomInt(2100, 10_000).toString() + '-01-' + day;
}

async function createCatalogItem(pool: Pool): Promise<{
  productId: string;
  variantId: string;
  modifierGroupId: string;
  modifierOptionId: string;
}> {
  const categoryId = randomUUID();
  const productId = randomUUID();
  const variantId = randomUUID();
  const modifierGroupId = randomUUID();
  const modifierOptionId = randomUUID();
  const sortOrder = randomInt(1_000_000, 2_000_000_000);

  await pool.query(`INSERT INTO categories (id, name, sort_order) VALUES ($1, $2, $3)`, [
    categoryId,
    `Категория ${categoryId}`,
    sortOrder,
  ]);
  await pool.query(
    `INSERT INTO products (id, category_id, type, name, sort_order)
     VALUES ($1, $2, 'DRINK', $3, $4)`,
    [productId, categoryId, `Напиток ${productId}`, sortOrder],
  );
  await pool.query(
    `INSERT INTO product_variants (id, product_id, size, price_minor, sort_order)
     VALUES ($1, $2, 'M', 19900, $3)`,
    [variantId, productId, sortOrder],
  );
  await pool.query(
    `INSERT INTO modifier_groups (id, name, selection_type, min_select, max_select)
     VALUES ($1, $2, 'single', 0, 1)`,
    [modifierGroupId, `Группа ${modifierGroupId}`],
  );
  await pool.query(
    `INSERT INTO modifier_options (id, group_id, name, price_delta_minor, sort_order)
     VALUES ($1, $2, $3, 5000, $4)`,
    [modifierOptionId, modifierGroupId, `Добавка ${modifierOptionId}`, sortOrder],
  );

  return { productId, variantId, modifierGroupId, modifierOptionId };
}

async function createCustomer(pool: Pool): Promise<string> {
  const customerId = randomUUID();
  const phone = '+7999' + Math.floor(Math.random() * 10_000_000).toString().padStart(7, '0');

  await pool.query(`INSERT INTO users (id, phone_e164) VALUES ($1, $2)`, [customerId, phone]);
  return customerId;
}

describe('схема заказов', () => {
  let pool: Pool;

  beforeAll(() => {
    if (databaseUrl === undefined) {
      throw new Error('DATABASE_URL is required for integration tests');
    }

    pool = new Pool({ connectionString: databaseUrl });
    runMigrations();
  });

  afterAll(async () => {
    await pool?.end();
  });

  it(
    'создаёт и повторно обновляет схему заказа с единственной настройкой приёма',
    async () => {
      runMigrations();
      const settings = await pool.query<{ key: string; value: boolean }>(
        'SELECT key, value FROM service_settings',
      );

      expect(settings.rows).toEqual([{ key: 'accepts_new_orders', value: true }]);
      const indexes = await pool.query<{ indexname: string }>(
        `SELECT indexname FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'orders_customer_created_at_id_desc_idx'`,
      );
      expect(indexes.rows).toEqual([{ indexname: 'orders_customer_created_at_id_desc_idx' }]);
      const pushIndexes = await pool.query<{ indexname: string }>(
        `SELECT indexname FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'push_subscriptions_user_id_idx'`,
      );
      expect(pushIndexes.rows).toEqual([{ indexname: 'push_subscriptions_user_id_idx' }]);
      await expect(pool.query(`UPDATE service_settings SET key = 'other'`)).rejects.toMatchObject({
        code: '23514',
      });
    },
    externalProcessTimeoutMs,
  );

  it(
    'сохраняет владельца push endpoint при повторной регистрации и разрешает обновление владельцу',
    async () => {
      const ownerA = await createCustomer(pool);
      const ownerB = await createCustomer(pool);
      const endpoint = `https://push.example/${randomUUID()}`;
      const repository = new PostgresPushSubscriptionRepository({ pool });

      await repository.upsert({ userId: ownerA, endpoint, p256dh: 'owner-a-key', auth: 'owner-a-auth' });
      await repository.upsert({ userId: ownerB, endpoint, p256dh: 'owner-b-key', auth: 'owner-b-auth' });

      await expect(
        pool.query<{ user_id: string; p256dh: string; auth: string }>(
          'SELECT user_id, p256dh, auth FROM push_subscriptions WHERE endpoint = $1',
          [endpoint],
        ),
      ).resolves.toMatchObject({ rows: [{ user_id: ownerA, p256dh: 'owner-a-key', auth: 'owner-a-auth' }] });

      await repository.upsert({ userId: ownerA, endpoint, p256dh: 'owner-a-refreshed-key', auth: 'owner-a-refreshed-auth' });

      await expect(
        pool.query<{ user_id: string; p256dh: string; auth: string }>(
          'SELECT user_id, p256dh, auth FROM push_subscriptions WHERE endpoint = $1',
          [endpoint],
        ),
      ).resolves.toMatchObject({
        rows: [{ user_id: ownerA, p256dh: 'owner-a-refreshed-key', auth: 'owner-a-refreshed-auth' }],
      });
    },
    externalProcessTimeoutMs,
  );

  it(
    'хранит независимые снимки позиций и добавок с внешними связями',
    async () => {
      const customerId = await createCustomer(pool);
      const catalogItem = await createCatalogItem(pool);
      const otherCatalogItem = await createCatalogItem(pool);
      const orderId = randomUUID();
      const itemId = randomUUID();
      const dailyNumber = randomInt(1, 998);
      const orderDay = createOrderDay('01');

      await pool.query(
        `INSERT INTO orders (
          id, number, customer_id, idempotency_key, request_fingerprint, total_minor, order_day, daily_number
        ) VALUES ($1, $2, $3, $4, $5, 24900, $6, $7)`,
        [
          orderId,
          createOrderNumber(orderDay, dailyNumber),
          customerId,
          randomUUID(),
          randomUUID(),
          orderDay,
          dailyNumber,
        ],
      );
      await pool.query(
        `INSERT INTO order_items (
          id, order_id, sort_order, product_id, variant_id, product_name, size, quantity, unit_total_minor, line_total_minor
        ) VALUES ($1, $2, 0, $3, $4, 'Капучино', 'M', 1, 24900, 24900)`,
        [itemId, orderId, catalogItem.productId, catalogItem.variantId],
      );
      await pool.query(
        `INSERT INTO order_item_modifiers (
          order_item_id, sort_order, modifier_option_id, modifier_name, price_delta_minor
        ) VALUES ($1, 0, $2, 'Овсяное молоко', 5000)`,
        [itemId, catalogItem.modifierOptionId],
      );
      await pool.query(`UPDATE products SET name = 'Новое имя' WHERE id = $1`, [catalogItem.productId]);
      await pool.query(`UPDATE modifier_options SET name = 'Новая добавка' WHERE id = $1`, [
        catalogItem.modifierOptionId,
      ]);

      await expect(
        pool.query(
          `SELECT item.product_name, item.size, item.sort_order, item.unit_total_minor, item.line_total_minor,
                  modifier.modifier_name, modifier.price_delta_minor, modifier.sort_order AS modifier_sort_order
           FROM order_items item
           JOIN order_item_modifiers modifier ON modifier.order_item_id = item.id
           WHERE item.id = $1`,
          [itemId],
        ),
      ).resolves.toMatchObject({
        rows: [
          {
            product_name: 'Капучино',
            size: 'M',
            sort_order: 0,
            unit_total_minor: 24900,
            line_total_minor: 24900,
            modifier_name: 'Овсяное молоко',
            price_delta_minor: 5000,
            modifier_sort_order: 0,
          },
        ],
      });
      await expect(
        pool.query(
          `INSERT INTO order_items (
            order_id, sort_order, product_id, product_name, quantity, unit_total_minor, line_total_minor
          ) VALUES ($1, 1, $2, 'Ошибка', 1, 100, 200)`,
          [orderId, catalogItem.productId],
        ),
      ).rejects.toMatchObject({ code: '23514' });
      await expect(
        pool.query(
          `INSERT INTO order_items (
            order_id, sort_order, product_id, variant_id, product_name, size, quantity, unit_total_minor, line_total_minor
          ) VALUES ($1, 1, $2, $3, 'Чужой размер', 'M', 1, 100, 100)`,
          [orderId, catalogItem.productId, otherCatalogItem.variantId],
        ),
      ).rejects.toMatchObject({ code: '23503' });
      await expect(
        pool.query(
          `INSERT INTO order_items (
            order_id, sort_order, product_id, variant_id, product_name, size, quantity, unit_total_minor, line_total_minor
          ) VALUES ($1, 1, $2, $3, 'Неверный размер', 'S', 1, 100, 100)`,
          [orderId, catalogItem.productId, catalogItem.variantId],
        ),
      ).rejects.toMatchObject({ code: '23503' });
      await expect(
        pool.query(
          `INSERT INTO order_item_modifiers (
            order_item_id, sort_order, modifier_option_id, modifier_name, price_delta_minor
          ) VALUES ($1, 1, $2, 'Ошибка', 0)`,
          [itemId, randomUUID()],
        ),
      ).rejects.toMatchObject({ code: '23503' });
      await expect(
        pool.query(
          `INSERT INTO order_items (
            order_id, sort_order, product_id, variant_id, product_name, size, quantity, unit_total_minor, line_total_minor
          ) VALUES ($1, -1, $2, $3, 'Отрицательный порядок', 'M', 1, 100, 100)`,
          [orderId, catalogItem.productId, catalogItem.variantId],
        ),
      ).rejects.toMatchObject({ code: '23514' });
      await expect(
        pool.query(
          `INSERT INTO order_items (
            order_id, sort_order, product_id, variant_id, product_name, size, quantity, unit_total_minor, line_total_minor
          ) VALUES ($1, 0, $2, $3, 'Повторный порядок', 'M', 1, 100, 100)`,
          [orderId, catalogItem.productId, catalogItem.variantId],
        ),
      ).rejects.toMatchObject({ code: '23505' });
      const anotherModifierOptionId = randomUUID();
      await pool.query(
        `INSERT INTO modifier_options (id, group_id, name, price_delta_minor, sort_order)
         VALUES ($1, $2, 'Дополнительная добавка', 0, 0)`,
        [anotherModifierOptionId, catalogItem.modifierGroupId],
      );
      await expect(
        pool.query(
          `INSERT INTO order_item_modifiers (
            order_item_id, sort_order, modifier_option_id, modifier_name, price_delta_minor
          ) VALUES ($1, 1, $2, 'Повторная добавка', 5000)`,
          [itemId, catalogItem.modifierOptionId],
        ),
      ).rejects.toMatchObject({ code: '23505' });
      await expect(
        pool.query(
          `INSERT INTO order_item_modifiers (
            order_item_id, sort_order, modifier_option_id, modifier_name, price_delta_minor
          ) VALUES ($1, 0, $2, 'Повторный порядок добавки', 0)`,
          [itemId, anotherModifierOptionId],
        ),
      ).rejects.toMatchObject({ code: '23505' });
    },
    externalProcessTimeoutMs,
  );

  it(
    'ограничивает дневной номер, стадию и идемпотентность customer',
    async () => {
      const firstCustomerId = await createCustomer(pool);
      const secondCustomerId = await createCustomer(pool);
      const idempotencyKey = randomUUID();
      const dailyNumber = randomInt(1, 997);
      const orderDay = createOrderDay('02');

      await pool.query(
        `INSERT INTO order_daily_counters (order_day, last_number) VALUES ($1, $2)`,
        [orderDay, dailyNumber],
      );
      await pool.query(
        `INSERT INTO orders (
          number, customer_id, idempotency_key, request_fingerprint, total_minor, order_day, daily_number
        ) VALUES ($1, $2, $3, $4, 0, $5, $6)`,
        [
          createOrderNumber(orderDay, dailyNumber),
          firstCustomerId,
          idempotencyKey,
          randomUUID(),
          orderDay,
          dailyNumber,
        ],
      );
      await expect(
        pool.query(
          `INSERT INTO orders (
            number, customer_id, idempotency_key, request_fingerprint, total_minor, order_day, daily_number
          ) VALUES ($1, $2, $3, $4, 0, $5, $6)`,
          [
            createOrderNumber(orderDay, dailyNumber + 1),
            firstCustomerId,
            idempotencyKey,
            randomUUID(),
            orderDay,
            dailyNumber + 1,
          ],
        ),
      ).rejects.toMatchObject({ code: '23505' });
      await expect(
        pool.query(
          `INSERT INTO orders (
            number, customer_id, idempotency_key, request_fingerprint, total_minor, order_day, daily_number
          ) VALUES ($1, $2, $3, $4, 0, $5, $6)`,
          [
            createOrderNumber(orderDay, dailyNumber + 1),
            secondCustomerId,
            idempotencyKey,
            randomUUID(),
            orderDay,
            dailyNumber + 1,
          ],
        ),
      ).resolves.toMatchObject({ rowCount: 1 });
      await expect(
        pool.query(`INSERT INTO order_daily_counters (order_day, last_number) VALUES ($1, 0)`, [
          createOrderDay('03'),
        ]),
      ).rejects.toMatchObject({ code: '23514' });
      await expect(
        pool.query(`INSERT INTO order_daily_counters (order_day, last_number) VALUES ($1, 1000)`, [
          createOrderDay('03'),
        ]),
      ).rejects.toMatchObject({ code: '23514' });
      const invalidOrderDay = createOrderDay('03');
      await expect(
        pool.query(
          `INSERT INTO orders (
            number, customer_id, idempotency_key, request_fingerprint, total_minor, order_day, daily_number
          ) VALUES ($1, $2, $3, $4, 0, $5, 0)`,
          [
            createOrderNumber(invalidOrderDay, 0),
            firstCustomerId,
            randomUUID(),
            randomUUID(),
            invalidOrderDay,
          ],
        ),
      ).rejects.toMatchObject({ code: '23514' });
      await expect(
        pool.query(
          `INSERT INTO orders (
            number, customer_id, idempotency_key, request_fingerprint, total_minor, order_day, daily_number, stage
          ) VALUES ($1, $2, $3, $4, 0, $5, $6, 'ACCEPTED')`,
          [
            createOrderNumber(orderDay, dailyNumber + 2),
            firstCustomerId,
            randomUUID(),
            randomUUID(),
            orderDay,
            dailyNumber + 2,
          ],
        ),
      ).resolves.toMatchObject({ rowCount: 1 });
      await expect(
        pool.query(
          `INSERT INTO orders (
            number, customer_id, idempotency_key, request_fingerprint, total_minor, order_day, daily_number
          ) VALUES ($1, $2, $3, '   ', 0, $4, $5)`,
          [
            createOrderNumber(orderDay, dailyNumber + 3),
            firstCustomerId,
            randomUUID(),
            orderDay,
            dailyNumber + 3,
          ],
        ),
      ).rejects.toMatchObject({ code: '23514' });
    },
    externalProcessTimeoutMs,
  );

  it(
    'откатывает заказ и снимок при ошибке сохранения позиции',
    async () => {
      const customerId = await createCustomer(pool);
      const orderId = randomUUID();
      const dailyNumber = randomInt(1, 998);
      const orderDay = createOrderDay('04');
      const client = await pool.connect();

      try {
        await client.query('BEGIN');
        await client.query(
          `INSERT INTO orders (
            id, number, customer_id, idempotency_key, request_fingerprint, total_minor, order_day, daily_number
          ) VALUES ($1, $2, $3, $4, $5, 100, $6, $7)`,
          [
            orderId,
            createOrderNumber(orderDay, dailyNumber),
            customerId,
            randomUUID(),
            randomUUID(),
            orderDay,
            dailyNumber,
          ],
        );
        await expect(
          client.query(
            `INSERT INTO order_items (
              order_id, sort_order, product_id, product_name, quantity, unit_total_minor, line_total_minor
            ) VALUES ($1, 0, $2, 'Ошибка снимка', 1, 100, 100)`,
            [orderId, randomUUID()],
          ),
        ).rejects.toMatchObject({ code: '23503' });
      } finally {
        await client.query('ROLLBACK');
        client.release();
      }

      await expect(pool.query('SELECT id FROM orders WHERE id = $1', [orderId])).resolves.toMatchObject({
        rows: [],
      });
    },
    externalProcessTimeoutMs,
  );
});
