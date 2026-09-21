import { randomInt, randomUUID } from "node:crypto";
import { Pool } from "pg";
import { PostgresPushSubscriptionRepository } from "../../src/notifications/adapters/postgres-push-subscription.repository";
import { PostgresOrderLifecycleRepository } from "../../src/orders/adapters/postgres-order-lifecycle.repository";

const databaseUrl = process.env.DATABASE_URL;
const externalProcessTimeoutMs = 30_000;

function createOrderNumber(orderDay: string, dailyNumber: number): string {
  return (
    orderDay.replaceAll("-", "") + "-" + dailyNumber.toString().padStart(3, "0")
  );
}

function createOrderDay(day: string): string {
  return randomInt(2100, 10_000).toString() + "-01-" + day;
}

async function createCatalogItem(pool: Pool): Promise<{
  productId: string;
  priceChoiceId: string;
  modifierGroupId: string;
  modifierOptionId: string;
}> {
  const categoryId = randomUUID();
  const productId = randomUUID();
  const priceChoiceId = randomUUID();
  const modifierGroupId = randomUUID();
  const modifierOptionId = randomUUID();
  const sortOrder = randomInt(1_000_000, 2_000_000_000);

  await pool.query(
    `INSERT INTO categories (id, name, sort_order) VALUES ($1, $2, $3)`,
    [categoryId, `Категория ${categoryId}`, sortOrder],
  );
  await pool.query(
    `INSERT INTO products (id, category_id, name, sort_order)
     VALUES ($1, $2, $3, $4)`,
    [productId, categoryId, `Напиток ${productId}`, sortOrder],
  );
  await pool.query(
    `INSERT INTO product_price_choices (id, product_id, portion_label, price, sort_order)
     VALUES ($1, $2, '250 мл', 199, $3)`,
    [priceChoiceId, productId, sortOrder],
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

  return { productId, priceChoiceId, modifierGroupId, modifierOptionId };
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
  });

  afterAll(async () => {
    await pool?.end();
  });

  it(
    "создаёт и повторно обновляет схему заказа с единственной настройкой приёма",
    async () => {
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
    "сохраняет владельца push endpoint и переносит связь только по версии",
    async () => {
      const ownerA = await createCustomer(pool);
      const ownerB = await createCustomer(pool);
      const endpoint = `https://push.example/${randomUUID()}`;
      const repository = new PostgresPushSubscriptionRepository({ pool });

      await repository.createAssociation({
        userId: ownerA,
        endpoint,
        p256dh: "owner-a-key",
        auth: "owner-a-auth",
      });
      await repository.createAssociation({
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

      const existing = await repository.findByEndpoint(endpoint);
      if (existing === null)
        throw new Error("Push association was not created");
      await repository.transferAssociation(
        existing,
        ownerB,
        existing.associationVersion,
      );

      await expect(
        pool.query<{ user_id: string; p256dh: string; auth: string }>(
          "SELECT user_id, p256dh, auth FROM push_subscriptions WHERE endpoint = $1",
          [endpoint],
        ),
      ).resolves.toMatchObject({
        rows: [
          {
            user_id: ownerB,
            p256dh: "owner-a-key",
            auth: "owner-a-auth",
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
          id, order_id, sort_order, product_id, price_choice_id, product_name, portion_label, quantity, unit_total, line_total
        ) VALUES ($1, $2, 0, $3, $4, 'Капучино', '250 мл', 1, 249, 249)`,
        [itemId, orderId, catalogItem.productId, catalogItem.priceChoiceId],
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
          `SELECT item.product_name, item.portion_label, item.sort_order, item.unit_total, item.line_total,
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
            portion_label: "250 мл",
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
            order_id, sort_order, product_id, price_choice_id, product_name, portion_label, quantity, unit_total, line_total
          ) VALUES ($1, 1, $2, $3, 'Чужая цена', '250 мл', 1, 100, 100)`,
          [orderId, catalogItem.productId, otherCatalogItem.priceChoiceId],
        ),
      ).rejects.toMatchObject({ code: "23503" });
      await expect(
        pool.query(
          `INSERT INTO order_items (
            order_id, sort_order, product_id, price_choice_id, product_name, portion_label, quantity, unit_total, line_total
          ) VALUES ($1, 1, $2, $3, 'Неверная цена', '350 мл', 1, 100, 100)`,
          [orderId, catalogItem.productId, catalogItem.priceChoiceId],
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
            order_id, sort_order, product_id, price_choice_id, product_name, portion_label, quantity, unit_total, line_total
          ) VALUES ($1, -1, $2, $3, 'Отрицательный порядок', '250 мл', 1, 100, 100)`,
          [orderId, catalogItem.productId, catalogItem.priceChoiceId],
        ),
      ).rejects.toMatchObject({ code: "23514" });
      await expect(
        pool.query(
          `INSERT INTO order_items (
            order_id, sort_order, product_id, price_choice_id, product_name, portion_label, quantity, unit_total, line_total
          ) VALUES ($1, 0, $2, $3, 'Повторный порядок', '250 мл', 1, 100, 100)`,
          [orderId, catalogItem.productId, catalogItem.priceChoiceId],
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
            id, order_id, sort_order, product_id, price_choice_id, product_name, portion_label, quantity, unit_total, line_total
          ) VALUES ($1, $2, 0, $3, $4, 'Снимок', '250 мл', 1, 249, 249)`,
          [itemId, orderId, catalogItem.productId, catalogItem.priceChoiceId],
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
