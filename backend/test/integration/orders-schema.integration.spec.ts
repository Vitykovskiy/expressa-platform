import { execFileSync } from "node:child_process";
import { randomInt, randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { Pool, PoolClient } from "pg";
import { PostgresPushSubscriptionRepository } from "../../src/notifications/adapters/postgres-push-subscription.repository";
import { PostgresOrderLifecycleRepository } from "../../src/orders/adapters/postgres-order-lifecycle.repository";

const databaseUrl = process.env.DATABASE_URL;
const externalProcessTimeoutMs = 30_000;
const legacyMigrationNames = [
  "0001_foundation.sql",
  "0002_e01_core_schema.sql",
  "0003_e04_auth.sql",
  "0004_e05_catalog.sql",
  "0005_e06_catalog_admin.sql",
  "0006_e07_orders.sql",
  "0007_e08_order_lifecycle.sql",
  "0008_e10_customer_order_reads.sql",
  "0009_e10_push_subscriptions.sql",
  "0010_e11_availability_audit.sql",
];

function runMigrations(): void {
  execFileSync("npm", ["run", "migrate"], {
    cwd: resolve(__dirname, "../.."),
    env: {
      ...process.env,
      JEST_WORKER_ID: undefined,
      NODE_ENV: "local",
      PORT: "3000",
      DATABASE_URL: databaseUrl,
      AUTH_ACCESS_TOKEN_SECRET: "orders-schema-access-token-secret",
      AUTH_OTP_PEPPER: "orders-schema-otp-pepper",
      AUTH_DEVELOPMENT_OTP: "123456",
      CORS_ORIGINS: "http://localhost:5173",
      VAPID_SUBJECT: "mailto:push@expressa.test",
      VAPID_PUBLIC_KEY:
        "BOT-VsrivTqPsMDCzS45APlNSMbgcTT5jqlrYu2-6PCRGB0YneXQDNsbrIxTAy0jJ-kUlKlWPm94PeirK8A8wCw",
      VAPID_PRIVATE_KEY: "9rZGGVplNbc2psiiiyOla_ZL-qDyrgIZqD_cpLz1G0c",
    },
    stdio: "inherit",
  });
}

function createOrderNumber(orderDay: string, dailyNumber: number): string {
  return (
    orderDay.replaceAll("-", "") + "-" + dailyNumber.toString().padStart(3, "0")
  );
}

function createOrderDay(day: string): string {
  return randomInt(2100, 10_000).toString() + "-01-" + day;
}

function createSchemaName(): string {
  return `whole_rubles_${randomUUID().replaceAll("-", "")}`;
}

async function withLegacySchema<T>(
  pool: Pool,
  callback: (client: PoolClient) => Promise<T>,
): Promise<T> {
  const schemaName = createSchemaName();
  const quotedSchemaName = `"${schemaName}"`;
  const client = await pool.connect();

  try {
    await client.query(`CREATE SCHEMA ${quotedSchemaName}`);
    await client.query(`SET search_path TO ${quotedSchemaName}`);

    for (const migrationName of legacyMigrationNames) {
      await client.query(
        await readFile(
          resolve(__dirname, "../../migrations", migrationName),
          "utf8",
        ),
      );
    }

    return await callback(client);
  } finally {
    await client.query("RESET search_path");
    await client.query(`DROP SCHEMA IF EXISTS ${quotedSchemaName} CASCADE`);
    client.release();
  }
}

async function applyWholeRublesMigration(client: PoolClient): Promise<void> {
  await client.query("BEGIN");

  try {
    await client.query(
      await readFile(
        resolve(__dirname, "../../migrations/0011_e12_whole_rubles.sql"),
        "utf8",
      ),
    );
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  }
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

  await pool.query(
    `INSERT INTO categories (id, name, sort_order) VALUES ($1, $2, $3)`,
    [categoryId, `Категория ${categoryId}`, sortOrder],
  );
  await pool.query(
    `INSERT INTO products (id, category_id, type, name, sort_order)
     VALUES ($1, $2, 'DRINK', $3, $4)`,
    [productId, categoryId, `Напиток ${productId}`, sortOrder],
  );
  await pool.query(
    `INSERT INTO product_variants (id, product_id, size, price, sort_order)
     VALUES ($1, $2, 'M', 199, $3)`,
    [variantId, productId, sortOrder],
  );
  await pool.query(
    `INSERT INTO modifier_groups (id, name, selection_type, min_select, max_select)
     VALUES ($1, $2, 'single', 0, 1)`,
    [modifierGroupId, `Группа ${modifierGroupId}`],
  );
  await pool.query(
    `INSERT INTO modifier_options (id, group_id, name, price_delta, sort_order)
     VALUES ($1, $2, $3, 50, $4)`,
    [
      modifierOptionId,
      modifierGroupId,
      `Добавка ${modifierOptionId}`,
      sortOrder,
    ],
  );

  return { productId, variantId, modifierGroupId, modifierOptionId };
}

async function createCustomer(pool: Pool): Promise<string> {
  const customerId = randomUUID();
  const phone =
    "+7999" +
    Math.floor(Math.random() * 10_000_000)
      .toString()
      .padStart(7, "0");

  await pool.query(`INSERT INTO users (id, phone_e164) VALUES ($1, $2)`, [
    customerId,
    phone,
  ]);
  return customerId;
}

describe("схема заказов", () => {
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
    "создаёт пустую схему с целыми рублями",
    async () => {
      await withLegacySchema(pool, async (client) => {
        await applyWholeRublesMigration(client);

        const columns = await client.query<{ column_name: string }>(
          `SELECT column_name
           FROM information_schema.columns
           WHERE table_schema = current_schema()
             AND table_name IN ('products', 'product_variants', 'modifier_options', 'orders', 'order_items', 'order_item_modifiers')
           ORDER BY table_name, column_name`,
        );

        expect(columns.rows.map(({ column_name }) => column_name)).toEqual(
          expect.arrayContaining([
            "line_total",
            "price",
            "price_delta",
            "total",
            "unit_total",
          ]),
        );
        expect(
          columns.rows.some(({ column_name }) =>
            column_name.endsWith("_minor"),
          ),
        ).toBe(false);
        const constraints = await client.query<{ conname: string }>(
          `SELECT conname
           FROM pg_constraint
           WHERE connamespace = current_schema()::regnamespace
             AND contype = 'c'`,
        );

        expect(constraints.rows.map(({ conname }) => conname)).toEqual(
          expect.arrayContaining([
            "modifier_options_price_delta_check",
            "order_item_modifiers_price_delta_check",
            "order_items_line_total_matches_unit_total_check",
          ]),
        );
        expect(
          constraints.rows.some(({ conname }) => conname.includes("_minor")),
        ).toBe(false);
      });
    },
    externalProcessTimeoutMs,
  );

  it(
    "точно переводит все денежные значения и сохраняет итог позиции",
    async () => {
      await withLegacySchema(pool, async (client) => {
        const categoryId = randomUUID();
        const productId = randomUUID();
        const drinkProductId = randomUUID();
        const variantId = randomUUID();
        const modifierGroupId = randomUUID();
        const modifierOptionId = randomUUID();
        const customerId = randomUUID();
        const orderId = randomUUID();
        const orderItemId = randomUUID();
        const orderDay = "2100-01-01";

        await client.query(
          `INSERT INTO categories (id, name, sort_order) VALUES ($1, 'Категория', 0)`,
          [categoryId],
        );
        await client.query(
          `INSERT INTO products (id, category_id, type, name, price_minor, sort_order)
           VALUES ($1, $2, 'OTHER', 'Товар', 22000, 0)`,
          [productId, categoryId],
        );
        await client.query(
          `INSERT INTO products (id, category_id, type, name, sort_order)
           VALUES ($1, $2, 'DRINK', 'Напиток', 1)`,
          [drinkProductId, categoryId],
        );
        await client.query(
          `INSERT INTO product_variants (id, product_id, size, price_minor, sort_order)
           VALUES ($1, $2, 'M', 32000, 0)`,
          [variantId, drinkProductId],
        );
        await client.query(
          `INSERT INTO modifier_groups (id, name, selection_type, min_select, max_select)
           VALUES ($1, 'Добавки', 'single', 0, 1)`,
          [modifierGroupId],
        );
        await client.query(
          `INSERT INTO modifier_options (id, group_id, name, price_delta_minor, sort_order)
           VALUES ($1, $2, 'Сироп', 5000, 0)`,
          [modifierOptionId, modifierGroupId],
        );
        await client.query(
          `INSERT INTO users (id, phone_e164) VALUES ($1, '+79991234567')`,
          [customerId],
        );
        await client.query(
          `INSERT INTO orders (
            id, number, customer_id, idempotency_key, request_fingerprint, total_minor, order_day, daily_number
          ) VALUES ($1, '21000101-001', $2, $3, 'fingerprint', 74000, $4, 1)`,
          [orderId, customerId, randomUUID(), orderDay],
        );
        await client.query(
          `INSERT INTO order_items (
            id, order_id, sort_order, product_id, product_name, quantity, unit_total_minor, line_total_minor
          ) VALUES ($1, $2, 0, $3, 'Товар', 2, 37000, 74000)`,
          [orderItemId, orderId, productId],
        );
        await client.query(
          `INSERT INTO order_item_modifiers (
            order_item_id, sort_order, modifier_option_id, modifier_name, price_delta_minor
          ) VALUES ($1, 0, $2, 'Сироп', 5000)`,
          [orderItemId, modifierOptionId],
        );

        await applyWholeRublesMigration(client);

        await expect(
          client.query(
            `SELECT products.price, variants.price AS variant_price, options.price_delta, orders.total,
                    items.unit_total, items.line_total, item_modifiers.price_delta AS item_price_delta
             FROM products
             CROSS JOIN product_variants variants
             JOIN modifier_options options ON options.id = $1
             JOIN orders ON orders.id = $2
             JOIN order_items items ON items.id = $3
             JOIN order_item_modifiers item_modifiers ON item_modifiers.order_item_id = items.id
             WHERE products.id = $4`,
            [modifierOptionId, orderId, orderItemId, productId],
          ),
        ).resolves.toMatchObject({
          rows: [
            {
              price: 220,
              variant_price: 320,
              price_delta: 50,
              total: 740,
              unit_total: 370,
              line_total: 740,
              item_price_delta: 50,
            },
          ],
        });
      });
    },
    externalProcessTimeoutMs,
  );

  it(
    "прерывает миграцию без изменения данных при копейках",
    async () => {
      await withLegacySchema(pool, async (client) => {
        const categoryId = randomUUID();
        const productId = randomUUID();

        await client.query(
          `INSERT INTO categories (id, name, sort_order) VALUES ($1, 'Категория', 0)`,
          [categoryId],
        );
        await client.query(
          `INSERT INTO products (id, category_id, type, name, price_minor, sort_order)
           VALUES ($1, $2, 'OTHER', 'Товар с копейками', 22001, 0)`,
          [productId, categoryId],
        );

        await expect(applyWholeRublesMigration(client)).rejects.toThrow(
          "whole-ruble migration",
        );
        await expect(
          client.query("SELECT price_minor FROM products WHERE id = $1", [
            productId,
          ]),
        ).resolves.toMatchObject({
          rows: [{ price_minor: 22001 }],
        });
      });
    },
    externalProcessTimeoutMs,
  );

  it(
    "создаёт и повторно обновляет схему заказа с единственной настройкой приёма",
    async () => {
      runMigrations();
      const settings = await pool.query<{
        key: string;
        value: boolean;
        id: string;
        updated_by: string | null;
        updated_at: Date | null;
      }>("SELECT key, value, id, updated_by, updated_at FROM service_settings");

      expect(settings.rows).toHaveLength(1);
      expect(settings.rows[0]).toMatchObject({
        key: "accepts_new_orders",
        value: true,
        id: expect.any(String),
        updated_by: null,
      });
      expect(
        settings.rows[0]?.updated_at === null ||
          settings.rows[0]?.updated_at instanceof Date,
      ).toBe(true);
      const indexes = await pool.query<{ indexname: string }>(
        `SELECT indexname FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'orders_customer_created_at_id_desc_idx'`,
      );
      expect(indexes.rows).toEqual([
        { indexname: "orders_customer_created_at_id_desc_idx" },
      ]);
      const pushIndexes = await pool.query<{ indexname: string }>(
        `SELECT indexname FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'push_subscriptions_user_id_idx'`,
      );
      expect(pushIndexes.rows).toEqual([
        { indexname: "push_subscriptions_user_id_idx" },
      ]);
      await expect(
        pool.query(`UPDATE service_settings SET key = 'other'`),
      ).rejects.toMatchObject({
        code: "23514",
      });
      await expect(
        pool.query(
          `INSERT INTO service_settings (key, value) VALUES ('accepts_new_orders', true)`,
        ),
      ).rejects.toMatchObject({
        code: "23505",
      });
    },
    externalProcessTimeoutMs,
  );

  it(
    "сохраняет владельца push endpoint при повторной регистрации и разрешает обновление владельцу",
    async () => {
      const ownerA = await createCustomer(pool);
      const ownerB = await createCustomer(pool);
      const endpoint = `https://push.example/${randomUUID()}`;
      const repository = new PostgresPushSubscriptionRepository({ pool });

      await repository.upsert({
        userId: ownerA,
        endpoint,
        p256dh: "owner-a-key",
        auth: "owner-a-auth",
      });
      await repository.upsert({
        userId: ownerB,
        endpoint,
        p256dh: "owner-b-key",
        auth: "owner-b-auth",
      });

      await expect(
        pool.query<{ user_id: string; p256dh: string; auth: string }>(
          "SELECT user_id, p256dh, auth FROM push_subscriptions WHERE endpoint = $1",
          [endpoint],
        ),
      ).resolves.toMatchObject({
        rows: [
          { user_id: ownerA, p256dh: "owner-a-key", auth: "owner-a-auth" },
        ],
      });

      await repository.upsert({
        userId: ownerA,
        endpoint,
        p256dh: "owner-a-refreshed-key",
        auth: "owner-a-refreshed-auth",
      });

      await expect(
        pool.query<{ user_id: string; p256dh: string; auth: string }>(
          "SELECT user_id, p256dh, auth FROM push_subscriptions WHERE endpoint = $1",
          [endpoint],
        ),
      ).resolves.toMatchObject({
        rows: [
          {
            user_id: ownerA,
            p256dh: "owner-a-refreshed-key",
            auth: "owner-a-refreshed-auth",
          },
        ],
      });
    },
    externalProcessTimeoutMs,
  );

  it(
    "хранит независимые снимки позиций и добавок с внешними связями",
    async () => {
      const customerId = await createCustomer(pool);
      const catalogItem = await createCatalogItem(pool);
      const otherCatalogItem = await createCatalogItem(pool);
      const orderId = randomUUID();
      const itemId = randomUUID();
      const dailyNumber = randomInt(1, 998);
      const orderDay = createOrderDay("01");

      await pool.query(
        `INSERT INTO orders (
          id, number, customer_id, idempotency_key, request_fingerprint, total, order_day, daily_number
        ) VALUES ($1, $2, $3, $4, $5, 249, $6, $7)`,
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
          id, order_id, sort_order, product_id, variant_id, product_name, size, quantity, unit_total, line_total
        ) VALUES ($1, $2, 0, $3, $4, 'Капучино', 'M', 1, 249, 249)`,
        [itemId, orderId, catalogItem.productId, catalogItem.variantId],
      );
      await pool.query(
        `INSERT INTO order_item_modifiers (
          order_item_id, sort_order, modifier_option_id, modifier_name, price_delta
        ) VALUES ($1, 0, $2, 'Овсяное молоко', 50)`,
        [itemId, catalogItem.modifierOptionId],
      );
      await pool.query(`UPDATE products SET name = 'Новое имя' WHERE id = $1`, [
        catalogItem.productId,
      ]);
      await pool.query(
        `UPDATE modifier_options SET name = 'Новая добавка' WHERE id = $1`,
        [catalogItem.modifierOptionId],
      );

      await expect(
        pool.query(
          `SELECT item.product_name, item.size, item.sort_order, item.unit_total, item.line_total,
                  modifier.modifier_name, modifier.price_delta, modifier.sort_order AS modifier_sort_order
           FROM order_items item
           JOIN order_item_modifiers modifier ON modifier.order_item_id = item.id
           WHERE item.id = $1`,
          [itemId],
        ),
      ).resolves.toMatchObject({
        rows: [
          {
            product_name: "Капучино",
            size: "M",
            sort_order: 0,
            unit_total: 249,
            line_total: 249,
            modifier_name: "Овсяное молоко",
            price_delta: 50,
            modifier_sort_order: 0,
          },
        ],
      });
      await expect(
        pool.query(
          `INSERT INTO order_items (
            order_id, sort_order, product_id, product_name, quantity, unit_total, line_total
          ) VALUES ($1, 1, $2, 'Ошибка', 1, 100, 200)`,
          [orderId, catalogItem.productId],
        ),
      ).rejects.toMatchObject({ code: "23514" });
      await expect(
        pool.query(
          `INSERT INTO order_items (
            order_id, sort_order, product_id, variant_id, product_name, size, quantity, unit_total, line_total
          ) VALUES ($1, 1, $2, $3, 'Чужой размер', 'M', 1, 100, 100)`,
          [orderId, catalogItem.productId, otherCatalogItem.variantId],
        ),
      ).rejects.toMatchObject({ code: "23503" });
      await expect(
        pool.query(
          `INSERT INTO order_items (
            order_id, sort_order, product_id, variant_id, product_name, size, quantity, unit_total, line_total
          ) VALUES ($1, 1, $2, $3, 'Неверный размер', 'S', 1, 100, 100)`,
          [orderId, catalogItem.productId, catalogItem.variantId],
        ),
      ).rejects.toMatchObject({ code: "23503" });
      await expect(
        pool.query(
          `INSERT INTO order_item_modifiers (
            order_item_id, sort_order, modifier_option_id, modifier_name, price_delta
          ) VALUES ($1, 1, $2, 'Ошибка', 0)`,
          [itemId, randomUUID()],
        ),
      ).rejects.toMatchObject({ code: "23503" });
      await expect(
        pool.query(
          `INSERT INTO order_item_modifiers (
            order_item_id, sort_order, modifier_option_id, modifier_name, price_delta
          ) VALUES ($1, 1, $2, 'Отрицательная добавка', -1)`,
          [itemId, catalogItem.modifierOptionId],
        ),
      ).rejects.toMatchObject({ code: "23514" });
      await expect(
        pool.query(
          `INSERT INTO order_items (
            order_id, sort_order, product_id, variant_id, product_name, size, quantity, unit_total, line_total
          ) VALUES ($1, -1, $2, $3, 'Отрицательный порядок', 'M', 1, 100, 100)`,
          [orderId, catalogItem.productId, catalogItem.variantId],
        ),
      ).rejects.toMatchObject({ code: "23514" });
      await expect(
        pool.query(
          `INSERT INTO order_items (
            order_id, sort_order, product_id, variant_id, product_name, size, quantity, unit_total, line_total
          ) VALUES ($1, 0, $2, $3, 'Повторный порядок', 'M', 1, 100, 100)`,
          [orderId, catalogItem.productId, catalogItem.variantId],
        ),
      ).rejects.toMatchObject({ code: "23505" });
      const anotherModifierOptionId = randomUUID();
      await pool.query(
        `INSERT INTO modifier_options (id, group_id, name, price_delta, sort_order)
         VALUES ($1, $2, 'Дополнительная добавка', 0, 0)`,
        [anotherModifierOptionId, catalogItem.modifierGroupId],
      );
      await expect(
        pool.query(
          `INSERT INTO order_item_modifiers (
            order_item_id, sort_order, modifier_option_id, modifier_name, price_delta
          ) VALUES ($1, 1, $2, 'Повторная добавка', 50)`,
          [itemId, catalogItem.modifierOptionId],
        ),
      ).rejects.toMatchObject({ code: "23505" });
      await expect(
        pool.query(
          `INSERT INTO order_item_modifiers (
            order_item_id, sort_order, modifier_option_id, modifier_name, price_delta
          ) VALUES ($1, 0, $2, 'Повторный порядок добавки', 0)`,
          [itemId, anotherModifierOptionId],
        ),
      ).rejects.toMatchObject({ code: "23505" });
    },
    externalProcessTimeoutMs,
  );

  it(
    "ограничивает дневной номер, стадию и идемпотентность customer",
    async () => {
      const firstCustomerId = await createCustomer(pool);
      const secondCustomerId = await createCustomer(pool);
      const idempotencyKey = randomUUID();
      const dailyNumber = randomInt(1, 997);
      const orderDay = createOrderDay("02");

      await pool.query(
        `INSERT INTO order_daily_counters (order_day, last_number) VALUES ($1, $2)`,
        [orderDay, dailyNumber],
      );
      await pool.query(
        `INSERT INTO orders (
          number, customer_id, idempotency_key, request_fingerprint, total, order_day, daily_number
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
            number, customer_id, idempotency_key, request_fingerprint, total, order_day, daily_number
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
      ).rejects.toMatchObject({ code: "23505" });
      await expect(
        pool.query(
          `INSERT INTO orders (
            number, customer_id, idempotency_key, request_fingerprint, total, order_day, daily_number
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
        pool.query(
          `INSERT INTO order_daily_counters (order_day, last_number) VALUES ($1, 0)`,
          [createOrderDay("03")],
        ),
      ).rejects.toMatchObject({ code: "23514" });
      await expect(
        pool.query(
          `INSERT INTO order_daily_counters (order_day, last_number) VALUES ($1, 1000)`,
          [createOrderDay("03")],
        ),
      ).rejects.toMatchObject({ code: "23514" });
      const invalidOrderDay = createOrderDay("03");
      await expect(
        pool.query(
          `INSERT INTO orders (
            number, customer_id, idempotency_key, request_fingerprint, total, order_day, daily_number
          ) VALUES ($1, $2, $3, $4, 0, $5, 0)`,
          [
            createOrderNumber(invalidOrderDay, 0),
            firstCustomerId,
            randomUUID(),
            randomUUID(),
            invalidOrderDay,
          ],
        ),
      ).rejects.toMatchObject({ code: "23514" });
      await expect(
        pool.query(
          `INSERT INTO orders (
            number, customer_id, idempotency_key, request_fingerprint, total, order_day, daily_number, stage
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
            number, customer_id, idempotency_key, request_fingerprint, total, order_day, daily_number
          ) VALUES ($1, $2, $3, '   ', 0, $4, $5)`,
          [
            createOrderNumber(orderDay, dailyNumber + 3),
            firstCustomerId,
            randomUUID(),
            orderDay,
            dailyNumber + 3,
          ],
        ),
      ).rejects.toMatchObject({ code: "23514" });
    },
    externalProcessTimeoutMs,
  );

  it(
    "откатывает заказ и снимок при ошибке сохранения позиции",
    async () => {
      const customerId = await createCustomer(pool);
      const orderId = randomUUID();
      const dailyNumber = randomInt(1, 998);
      const orderDay = createOrderDay("04");
      const client = await pool.connect();

      try {
        await client.query("BEGIN");
        await client.query(
          `INSERT INTO orders (
            id, number, customer_id, idempotency_key, request_fingerprint, total, order_day, daily_number
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
              order_id, sort_order, product_id, product_name, quantity, unit_total, line_total
            ) VALUES ($1, 0, $2, 'Ошибка снимка', 1, 100, 100)`,
            [orderId, randomUUID()],
          ),
        ).rejects.toMatchObject({ code: "23503" });
      } finally {
        await client.query("ROLLBACK");
        client.release();
      }

      await expect(
        pool.query("SELECT id FROM orders WHERE id = $1", [orderId]),
      ).resolves.toMatchObject({
        rows: [],
      });
    },
    externalProcessTimeoutMs,
  );

  it(
    "читает страницу customer истории batched запросами без N+1",
    async () => {
      const customerId = await createCustomer(pool);
      const catalogItem = await createCatalogItem(pool);
      const orderDay = createOrderDay("05");
      const orderIds = Array.from({ length: 21 }, () => randomUUID());

      for (const [index, orderId] of orderIds.entries()) {
        const itemId = randomUUID();
        await pool.query(
          `INSERT INTO orders (
            id, number, customer_id, idempotency_key, request_fingerprint, total, order_day, daily_number, created_at
          ) VALUES ($1, $2, $3, $4, $5, 249, $6, $7, $8)`,
          [
            orderId,
            createOrderNumber(orderDay, index + 1),
            customerId,
            randomUUID(),
            randomUUID(),
            orderDay,
            index + 1,
            new Date(Date.UTC(2035, 0, 1, 0, 0, index)),
          ],
        );
        await pool.query(
          `INSERT INTO order_items (
            id, order_id, sort_order, product_id, variant_id, product_name, size, quantity, unit_total, line_total
          ) VALUES ($1, $2, 0, $3, $4, 'Снимок', 'M', 1, 249, 249)`,
          [itemId, orderId, catalogItem.productId, catalogItem.variantId],
        );
        await pool.query(
          `INSERT INTO order_item_modifiers (
            order_item_id, sort_order, modifier_option_id, modifier_name, price_delta
          ) VALUES ($1, 0, $2, 'Добавка снимка', 50)`,
          [itemId, catalogItem.modifierOptionId],
        );
      }

      const query = jest.fn(pool.query.bind(pool));
      const repository = new PostgresOrderLifecycleRepository({
        pool: { query } as unknown as Pool,
      });
      const page = await repository.listForCustomer(customerId, null);

      expect(page.orders).toHaveLength(20);
      expect(page.orders.map((order) => order.id)).toEqual(
        [...orderIds].reverse().slice(0, 20),
      );
      expect(
        page.orders.every((order) => {
          const snapshot = order.snapshot[0];
          return (
            snapshot?.productName === "Снимок" &&
            snapshot.modifiers[0]?.modifierName === "Добавка снимка"
          );
        }),
      ).toBe(true);
      expect(page.nextCursor).toEqual({
        createdAt: expect.any(String),
        id: orderIds[1],
      });
      expect(query).toHaveBeenCalledTimes(3);
      expect(
        query.mock.calls.filter(
          ([sql]) => typeof sql === "string" && sql.includes("FROM orders"),
        ).length,
      ).toBe(1);
      expect(
        query.mock.calls.filter(
          ([sql]) =>
            typeof sql === "string" &&
            sql.includes("SELECT id, order_id, product_id"),
        ).length,
      ).toBe(1);
      expect(
        query.mock.calls.filter(
          ([sql]) =>
            typeof sql === "string" &&
            sql.includes("FROM order_item_modifiers"),
        ).length,
      ).toBe(1);
    },
    externalProcessTimeoutMs,
  );
});
