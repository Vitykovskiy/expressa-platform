import { randomUUID } from "node:crypto";
import type { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import type { AddressInfo } from "node:net";
import { Pool } from "pg";
import { AppModule } from "../../src/app.module";
import { clockPort } from "../../src/auth/application/clock.constants";
import type { Clock } from "../../src/auth/application/clock.types";
import { migrateDatabase } from "../../src/platform/database/migrations";
import { configureHttp } from "../../src/platform/http/http-configuration";
import { configureObservability } from "../../src/platform/observability/observability-configuration";

const databaseUrl = process.env.DATABASE_URL;
const otp = process.env.AUTH_DEVELOPMENT_OTP ?? "123456";

describe("create order E2E", () => {
  let app: INestApplication;
  let pool: Pool;
  let url: string;
  let clock: Clock;
  let categoryId: string;
  let productId: string;
  let variantId: string;
  let groupId: string;
  let optionId: string;
  const phones = new Set<string>();

  beforeAll(async () => {
    if (databaseUrl === undefined)
      throw new Error("DATABASE_URL is required for e2e tests");
    pool = new Pool({ connectionString: databaseUrl });
    await migrateDatabase(pool, "migrations");
    const module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = module.createNestApplication();
    configureHttp(app, "local");
    configureObservability(app);
    await app.listen(0, "127.0.0.1");
    url = `http://127.0.0.1:${(app.getHttpServer().address() as AddressInfo).port}`;
    clock = app.get<Clock>(clockPort);
  });

  beforeEach(async () => {
    jest.restoreAllMocks();
    await resetState();
    categoryId = randomUUID();
    productId = randomUUID();
    variantId = randomUUID();
    groupId = randomUUID();
    optionId = randomUUID();
    await seedCatalog();
  });

  afterEach(async () => {
    jest.restoreAllMocks();
    await resetState();
  });

  afterAll(async () => {
    await app?.close();
    await pool?.end();
  });

  it("создаёт customer-заказ с полным снимком и UTC-номером на границе суток", async () => {
    useClock("2031-02-03T23:59:59.999Z");
    const customer = await accessToken("customer");
    const response = await createOrder(
      customer,
      orderBody(64_000),
      randomUUID(),
      "success-request-id",
    );

    expect(response.status).toBe(201);
    expect(response.headers.get("x-request-id")).toBe("success-request-id");
    await expect(response.json()).resolves.toEqual({
      id: expect.any(String),
      number: "20310203-001",
      stage: "CREATED",
      totalMinor: 64_000,
      items: [
        {
          productId,
          variantId,
          productName: "Капучино",
          size: "M",
          quantity: 2,
          unitTotalMinor: 32_000,
          lineTotalMinor: 64_000,
          modifiers: [
            {
              modifierOptionId: optionId,
              modifierName: "Обычное",
              priceDeltaMinor: 0,
            },
          ],
        },
      ],
    });

    useClock("2031-02-04T00:00:00.000Z");
    const next = await createOrder(
      customer,
      orderBody(32_000),
      randomUUID(),
      "utc-boundary-request-id",
    );
    expect(next.status).toBe(201);
    await expect(next.json()).resolves.toMatchObject({
      number: "20310204-001",
    });
  });

  it("не создаёт заказ для guest, barista или administrator", async () => {
    useClock("2031-02-05T12:00:00.000Z");
    const barista = await accessToken("barista");
    const administrator = await accessToken("administrator");
    const before = await orderCount();

    await expectStructuredError(
      await createOrder(
        undefined,
        orderBody(32_000),
        randomUUID(),
        "guest-request-id",
      ),
      401,
      "UNAUTHORIZED",
      null,
      "guest-request-id",
    );
    for (const [token, requestId] of [
      [barista, "barista-request-id"],
      [administrator, "administrator-request-id"],
    ] as const) {
      await expectStructuredError(
        await createOrder(token, orderBody(32_000), randomUUID(), requestId),
        403,
        "ACCESS_DENIED",
        null,
        requestId,
      );
    }

    expect(await orderCount()).toBe(before);
  });

  it("отклоняет изменённый итог, недоступность, неверную конфигурацию и закрытый приём без заказа", async () => {
    useClock("2031-02-06T12:00:00.000Z");
    const customer = await accessToken("customer");
    const before = await orderCount();

    await expectStructuredError(
      await createOrder(
        customer,
        orderBody(1),
        randomUUID(),
        "total-request-id",
      ),
      400,
      "ORDER_TOTAL_CHANGED",
      { totalMinor: 32_000 },
      "total-request-id",
    );
    await pool.query("UPDATE products SET is_available = false WHERE id = $1", [
      productId,
    ]);
    await expectStructuredError(
      await createOrder(
        customer,
        orderBody(32_000),
        randomUUID(),
        "unavailable-request-id",
      ),
      400,
      "MENU_ITEM_UNAVAILABLE",
      { itemId: productId },
      "unavailable-request-id",
    );
    await pool.query("UPDATE products SET is_available = true WHERE id = $1", [
      productId,
    ]);
    await expectStructuredError(
      await createOrder(
        customer,
        {
          expectedTotalMinor: 32_000,
          items: [{ productId, variantId, modifierOptionIds: [], quantity: 1 }],
        },
        randomUUID(),
        "configuration-request-id",
      ),
      400,
      "VALIDATION_ERROR",
      null,
      "configuration-request-id",
    );
    await pool.query(
      "UPDATE service_settings SET value = false WHERE key = 'accepts_new_orders'",
    );
    await expectStructuredError(
      await createOrder(
        customer,
        orderBody(32_000),
        randomUUID(),
        "closed-request-id",
      ),
      400,
      "ORDER_INTAKE_CLOSED",
      null,
      "closed-request-id",
    );

    expect(await orderCount()).toBe(before);
  });

  it("повторяет конкурентный запрос тем же ответом и не создаёт дубль", async () => {
    useClock("2031-02-07T12:00:00.000Z");
    const customer = await accessToken("customer");
    const key = randomUUID();
    const [first, second] = await Promise.all([
      createOrder(
        customer,
        orderBody(32_000),
        key,
        "concurrent-first-request-id",
      ),
      createOrder(
        customer,
        orderBody(32_000),
        key,
        "concurrent-second-request-id",
      ),
    ]);

    expect(first.status).toBe(201);
    expect(second.status).toBe(201);
    expect(await first.json()).toEqual(await second.json());
    expect(await orderCount()).toBe(1);
  });

  it("отклоняет другой fingerprint и сохраняет первоначальный неизменяемый снимок", async () => {
    useClock("2031-02-08T12:00:00.000Z");
    const customer = await accessToken("customer");
    const key = randomUUID();
    const created = await createOrder(
      customer,
      orderBody(32_000),
      key,
      "created-request-id",
    );
    expect(created.status).toBe(201);
    const snapshot = await created.json();

    await pool.query(
      "UPDATE products SET name = 'Изменённый капучино' WHERE id = $1",
      [productId],
    );
    await pool.query(
      "UPDATE product_variants SET price_minor = 45_000 WHERE id = $1",
      [variantId],
    );
    await pool.query(
      "UPDATE modifier_options SET name = 'Изменённое молоко', price_delta_minor = 5_000 WHERE id = $1",
      [optionId],
    );
    const replay = await createOrder(
      customer,
      orderBody(32_000),
      key,
      "replay-request-id",
    );
    expect(replay.status).toBe(201);
    expect(await replay.json()).toEqual(snapshot);

    const conflict = await createOrder(
      customer,
      orderBody(64_000),
      key,
      "conflict-request-id",
    );
    await expectStructuredError(
      conflict,
      409,
      "IDEMPOTENCY_KEY_REUSED",
      null,
      "conflict-request-id",
    );
    expect(await orderCount()).toBe(1);
  });

  it("перепроверяет заказ после admin-изменения сохранённого размера", async () => {
    useClock("2031-02-08T13:00:00.000Z");
    const [administrator, customer] = await Promise.all([
      accessToken("administrator"),
      accessToken("customer"),
    ]);
    const priceUpdate = await updateProductVariant(administrator, 45_000, true);
    expect(priceUpdate.status).toBe(200);
    await expect(priceUpdate.json()).resolves.toMatchObject({
      variants: [expect.objectContaining({ id: variantId, size: "M" })],
    });

    await expectStructuredError(
      await createOrder(
        customer,
        orderBody(32_000),
        randomUUID(),
        "stale-price-request-id",
      ),
      400,
      "ORDER_TOTAL_CHANGED",
      { totalMinor: 45_000 },
      "stale-price-request-id",
    );
    expect(
      (
        await createOrder(
          customer,
          orderBody(45_000),
          randomUUID(),
          "reconfirmed-price-request-id",
        )
      ).status,
    ).toBe(201);

    const availabilityUpdate = await updateProductVariant(
      administrator,
      45_000,
      false,
    );
    expect(availabilityUpdate.status).toBe(200);
    await expectStructuredError(
      await createOrder(
        customer,
        orderBody(45_000),
        randomUUID(),
        "unavailable-variant-request-id",
      ),
      400,
      "MENU_ITEM_UNAVAILABLE",
      { itemId: variantId },
      "unavailable-variant-request-id",
    );
  });

  it("разделяет ключ разных customer и выдаёт уникальные номера разным ключам", async () => {
    useClock("2031-02-09T12:00:00.000Z");
    const [firstCustomer, secondCustomer] = await Promise.all([
      accessToken("customer"),
      accessToken("customer"),
    ]);
    const sharedKey = randomUUID();
    const [first, second] = await Promise.all([
      createOrder(
        firstCustomer,
        orderBody(32_000),
        sharedKey,
        "customer-one-request-id",
      ),
      createOrder(
        secondCustomer,
        orderBody(32_000),
        sharedKey,
        "customer-two-request-id",
      ),
    ]);
    expect(first.status).toBe(201);
    expect(second.status).toBe(201);
    expect(((await first.json()) as { id: string }).id).not.toBe(
      ((await second.json()) as { id: string }).id,
    );
    const [third, fourth] = await Promise.all([
      createOrder(
        firstCustomer,
        orderBody(32_000),
        randomUUID(),
        "number-one-request-id",
      ),
      createOrder(
        secondCustomer,
        orderBody(32_000),
        randomUUID(),
        "number-two-request-id",
      ),
    ]);
    expect(third.status).toBe(201);
    expect(fourth.status).toBe(201);
    expect(((await third.json()) as { number: string }).number).not.toBe(
      ((await fourth.json()) as { number: string }).number,
    );
  });

  function useClock(value: string): void {
    jest.spyOn(clock, "now").mockReturnValue(new Date(value));
  }

  async function accessToken(
    role: "administrator" | "barista" | "customer",
  ): Promise<string> {
    const phone = `+7999${Math.floor(Math.random() * 10_000_000)
      .toString()
      .padStart(7, "0")}`;
    phones.add(phone);
    if (role !== "customer")
      await pool.query("INSERT INTO users (phone_e164, role) VALUES ($1, $2)", [
        phone,
        role,
      ]);
    await fetch(`${url}/api/v1/auth/otp/request`, {
      method: "POST",
      headers: headers(randomUUID()),
      body: JSON.stringify({ phone }),
    });
    const verified = await fetch(`${url}/api/v1/auth/otp/verify`, {
      method: "POST",
      headers: headers(randomUUID()),
      body: JSON.stringify({ phone, code: otp }),
    });
    expect(verified.status).toBe(200);
    return ((await verified.json()) as { accessToken: string }).accessToken;
  }

  function orderBody(expectedTotalMinor: number) {
    return {
      expectedTotalMinor,
      items: [
        {
          productId,
          variantId,
          modifierOptionIds: [optionId],
          quantity: expectedTotalMinor === 64_000 ? 2 : 1,
        },
      ],
    };
  }

  function updateProductVariant(
    token: string,
    priceMinor: number,
    isAvailable: boolean,
  ): Promise<Response> {
    return fetch(`${url}/api/v1/backoffice/catalog/products/${productId}`, {
      method: "PATCH",
      headers: headers(randomUUID(), { authorization: `Bearer ${token}` }),
      body: JSON.stringify({
        categoryId,
        type: "DRINK",
        name: "Капучино",
        description: "Кофе с молоком",
        priceMinor: null,
        sortOrder: 10,
        isActive: true,
        isAvailable: true,
        variants: [
          { size: "M", priceMinor, sortOrder: 10, isAvailable },
          ...(isAvailable
            ? []
            : [
                {
                  size: "L",
                  priceMinor: 50_000,
                  sortOrder: 20,
                  isAvailable: true,
                },
              ]),
        ],
      }),
    });
  }

  function createOrder(
    token: string | undefined,
    body: ReturnType<typeof orderBody>,
    key: string,
    requestId: string,
  ): Promise<Response> {
    return fetch(`${url}/api/v1/orders`, {
      method: "POST",
      headers: headers(requestId, {
        "idempotency-key": key,
        ...(token === undefined ? {} : { authorization: `Bearer ${token}` }),
      }),
      body: JSON.stringify(body),
    });
  }

  async function orderCount(): Promise<number> {
    const result = await pool.query<{ count: number }>(
      "SELECT COUNT(*)::int AS count FROM orders WHERE customer_id IN (SELECT id FROM users WHERE phone_e164 = ANY($1::text[]))",
      [[...phones]],
    );
    return result.rows[0]?.count ?? 0;
  }

  async function seedCatalog(): Promise<void> {
    await pool.query(
      `INSERT INTO categories (id, name, description, sort_order) VALUES ($1, 'Кофе', 'Напитки', 10)`,
      [categoryId],
    );
    await pool.query(
      `INSERT INTO products (id, category_id, type, name, description, price_minor, sort_order) VALUES ($1, $2, 'DRINK', 'Капучино', 'Кофе с молоком', NULL, 10)`,
      [productId, categoryId],
    );
    await pool.query(
      `INSERT INTO product_variants (id, product_id, size, price_minor, sort_order) VALUES ($1, $2, 'M', 32000, 10)`,
      [variantId, productId],
    );
    await pool.query(
      `INSERT INTO modifier_groups (id, name, selection_type, min_select, max_select) VALUES ($1, 'Молоко', 'single', 1, 1)`,
      [groupId],
    );
    await pool.query(
      `INSERT INTO modifier_options (id, group_id, name, price_delta_minor, sort_order, is_default) VALUES ($1, $2, 'Обычное', 0, 10, true)`,
      [optionId, groupId],
    );
    await pool.query(
      "INSERT INTO category_modifier_groups (category_id, group_id, sort_order) VALUES ($1, $2, 10)",
      [categoryId, groupId],
    );
  }

  async function resetState(): Promise<void> {
    await pool.query(
      "UPDATE service_settings SET value = true WHERE key = 'accepts_new_orders'",
    );
    await pool.query("DELETE FROM order_item_modifiers");
    await pool.query("DELETE FROM order_items");
    await pool.query("DELETE FROM orders");
    await pool.query("DELETE FROM order_daily_counters");
    await pool.query("DELETE FROM audit_events");
    await pool.query("DELETE FROM category_modifier_groups");
    await pool.query("DELETE FROM modifier_options");
    await pool.query("DELETE FROM product_variants");
    await pool.query("DELETE FROM products");
    await pool.query("DELETE FROM modifier_groups");
    await pool.query("DELETE FROM categories");
    await pool.query("DELETE FROM sessions");
    await pool.query("DELETE FROM otp_challenges");
    await pool.query("DELETE FROM users");
    phones.clear();
  }
});

function headers(
  requestId: string,
  extra: Record<string, string> = {},
): Record<string, string> {
  return {
    "content-type": "application/json",
    "x-request-id": requestId,
    ...extra,
  };
}

async function expectStructuredError(
  response: Response,
  status: number,
  code: string,
  details: unknown,
  requestId: string,
): Promise<void> {
  expect(response.status).toBe(status);
  expect(response.headers.get("x-request-id")).toBe(requestId);
  await expect(response.json()).resolves.toEqual({
    code,
    message: expect.any(String),
    details,
    requestId,
  });
}
