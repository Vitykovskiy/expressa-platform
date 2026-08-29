import { execFileSync } from "node:child_process";
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
const seededCappuccinoId = "00000000-0000-4000-8000-000000000010";
const seededMediumVariantId = "00000000-0000-4000-8000-000000000012";
const seededMilkOptionId = "00000000-0000-4000-8000-000000000101";

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
      orderBody(640),
      randomUUID(),
      "success-request-id",
    );

    expect(response.status).toBe(201);
    expect(response.headers.get("x-request-id")).toBe("success-request-id");
    await expect(response.json()).resolves.toEqual({
      id: expect.any(String),
      number: "20310203-001",
      stage: "CREATED",
      total: 640,
      items: [
        {
          productId,
          variantId,
          productName: "Капучино",
          size: "M",
          quantity: 2,
          unitTotal: 320,
          lineTotal: 640,
          modifiers: [
            {
              modifierOptionId: optionId,
              modifierName: "Обычное",
              priceDelta: 0,
            },
          ],
        },
      ],
    });

    useClock("2031-02-04T00:00:00.000Z");
    const next = await createOrder(
      customer,
      orderBody(320),
      randomUUID(),
      "utc-boundary-request-id",
    );
    expect(next.status).toBe(201);
    await expect(next.json()).resolves.toMatchObject({
      number: "20310204-001",
    });
  });

  it("Q-SMOKE: на чистом состоянии после миграций и idempotent seed проводит API-заказ до ISSUED", async () => {
    await resetState();
    runSeed();
    runSeed();

    const [customer, barista] = await Promise.all([
      accessToken("customer"),
      accessToken("barista"),
    ]);
    const created = await createOrder(
      customer,
      {
        expectedTotal: 320,
        items: [
          {
            productId: seededCappuccinoId,
            variantId: seededMediumVariantId,
            modifierOptionIds: [seededMilkOptionId],
            quantity: 1,
          },
        ],
      },
      randomUUID(),
      "q-smoke-create-request-id",
    );

    expect(created.status).toBe(201);
    const { id: orderId } = (await created.json()) as { id: string };
    for (const action of ["accept", "start-preparing", "mark-ready", "issue"] as const) {
      const transition = await transitionOrder(barista, orderId, action);
      expect(transition.status).toBe(200);
    }

    const detail = await getOrder(customer, orderId, "q-smoke-history-request-id");
    expect(detail.status).toBe(200);
    await expect(detail.json()).resolves.toMatchObject({
      id: orderId,
      stage: "ISSUED",
      snapshot: [{ productId: seededCappuccinoId, variantId: seededMediumVariantId }],
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
        orderBody(320),
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
        await createOrder(token, orderBody(320), randomUUID(), requestId),
        403,
        "ACCESS_DENIED",
        null,
        requestId,
      );
    }

    expect(await orderCount()).toBe(before);
  });

  it("возвращает customer только собственные снимки без событий staff и пагинирует историю", async () => {
    useClock("2031-02-05T13:00:00.000Z");
    const [owner, stranger, barista] = await Promise.all([
      accessToken("customer"),
      accessToken("customer"),
      accessToken("barista"),
    ]);
    const first = await createOrder(owner, orderBody(320), randomUUID(), "owner-first-request-id");
    expect(first.status).toBe(201);
    const firstOrder = (await first.json()) as { id: string };
    await pool.query("UPDATE products SET name = 'Новое имя каталога' WHERE id = $1", [productId]);
    for (let index = 0; index < 20; index += 1) {
      const created = await createOrder(owner, orderBody(320), randomUUID(), `owner-page-${index}-request-id`);
      expect(created.status).toBe(201);
    }

    const firstPage = await getOrders(owner);
    expect(firstPage.status).toBe(200);
    const firstPageBody = (await firstPage.json()) as { orders: Array<{ id: string; snapshot: Array<{ productName: string }> }>; nextCursor: string | null };
    expect(firstPageBody.orders).toHaveLength(20);
    expect(firstPageBody.nextCursor).toEqual(expect.any(String));
    const secondPage = await getOrders(owner, firstPageBody.nextCursor!);
    const secondPageBody = (await secondPage.json()) as { orders: Array<{ id: string }>; nextCursor: string | null };
    expect(secondPageBody.orders).toHaveLength(1);
    expect([...firstPageBody.orders, ...secondPageBody.orders].map((order) => order.id)).toHaveLength(21);
    expect(new Set([...firstPageBody.orders, ...secondPageBody.orders].map((order) => order.id)).size).toBe(21);

    const detail = await getOrder(owner, firstOrder.id, "get-order-owner-request-id");
    await expect(detail.json()).resolves.toMatchObject({ id: firstOrder.id, snapshot: [{ productName: 'Капучино' }] });
    await expectStructuredError(await getOrder(undefined, firstOrder.id, "get-order-guest-request-id"), 401, "UNAUTHORIZED", null, "get-order-guest-request-id");
    await expectStructuredError(await getOrder(barista, firstOrder.id, "get-order-barista-request-id"), 403, "ACCESS_DENIED", null, "get-order-barista-request-id");
    await expectStructuredError(await getOrder(stranger, firstOrder.id, "get-order-stranger-request-id"), 404, "ORDER_NOT_FOUND", null, "get-order-stranger-request-id");
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
      { total: 320 },
      "total-request-id",
    );
    await pool.query("UPDATE products SET is_available = false WHERE id = $1", [
      productId,
    ]);
    await expectStructuredError(
      await createOrder(
        customer,
        orderBody(320),
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
          expectedTotal: 320,
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
    const barista = await accessToken('barista');
    expect((await updateIntake(barista, false)).status).toBe(200);
    await expectStructuredError(
      await createOrder(
        customer,
        orderBody(320),
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
        orderBody(320),
        key,
        "concurrent-first-request-id",
      ),
      createOrder(
        customer,
        orderBody(320),
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
      orderBody(320),
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
      "UPDATE product_variants SET price = 450 WHERE id = $1",
      [variantId],
    );
    await pool.query(
      "UPDATE modifier_options SET name = 'Изменённое молоко', price_delta = 50 WHERE id = $1",
      [optionId],
    );
    const replay = await createOrder(
      customer,
      orderBody(320),
      key,
      "replay-request-id",
    );
    expect(replay.status).toBe(201);
    expect(await replay.json()).toEqual(snapshot);

    const conflict = await createOrder(
      customer,
      orderBody(640),
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
    const priceUpdate = await updateProductVariant(administrator, 450, true);
    expect(priceUpdate.status).toBe(200);
    await expect(priceUpdate.json()).resolves.toMatchObject({
      variants: [expect.objectContaining({ id: variantId, size: "M" })],
    });

    await expectStructuredError(
      await createOrder(
        customer,
        orderBody(320),
        randomUUID(),
        "stale-price-request-id",
      ),
      400,
      "ORDER_TOTAL_CHANGED",
      { total: 450 },
      "stale-price-request-id",
    );
    expect(
      (
        await createOrder(
          customer,
          orderBody(450),
          randomUUID(),
          "reconfirmed-price-request-id",
        )
      ).status,
    ).toBe(201);

    const availabilityUpdate = await updateProductVariant(
      administrator,
      450,
      false,
    );
    expect(availabilityUpdate.status).toBe(200);
    await expectStructuredError(
      await createOrder(
        customer,
        orderBody(450),
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
        orderBody(320),
        sharedKey,
        "customer-one-request-id",
      ),
      createOrder(
        secondCustomer,
        orderBody(320),
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
        orderBody(320),
        randomUUID(),
        "number-one-request-id",
      ),
      createOrder(
        secondCustomer,
        orderBody(320),
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
    await fetch(`${url}/api/v2/auth/otp/request`, {
      method: "POST",
      headers: headers(randomUUID()),
      body: JSON.stringify({ phone }),
    });
    const verified = await fetch(`${url}/api/v2/auth/otp/verify`, {
      method: "POST",
      headers: headers(randomUUID()),
      body: JSON.stringify({ phone, code: otp }),
    });
    expect(verified.status).toBe(200);
    return ((await verified.json()) as { accessToken: string }).accessToken;
  }

  function orderBody(expectedTotal: number) {
    return {
      expectedTotal,
      items: [
        {
          productId,
          variantId,
          modifierOptionIds: [optionId],
          quantity: expectedTotal === 640 ? 2 : 1,
        },
      ],
    };
  }

  function updateProductVariant(
    token: string,
    price: number,
    isAvailable: boolean,
  ): Promise<Response> {
    return fetch(`${url}/api/v2/backoffice/catalog/products/${productId}`, {
      method: "PATCH",
      headers: headers(randomUUID(), { authorization: `Bearer ${token}` }),
      body: JSON.stringify({
        categoryId,
        type: "DRINK",
        name: "Капучино",
        description: "Кофе с молоком",
        price: null,
        sortOrder: 10,
        isActive: true,
        isAvailable: true,
        variants: [
          { size: "M", price, sortOrder: 10, isAvailable },
          ...(isAvailable
            ? []
            : [
                {
                  size: "L",
                  price: 500,
                  sortOrder: 20,
                  isAvailable: true,
                },
              ]),
        ],
      }),
    });
  }

  function updateIntake(token: string, acceptsNewOrders: boolean): Promise<Response> {
    return fetch(`${url}/api/v2/backoffice/service/intake`, {
      method: 'PATCH',
      headers: headers(randomUUID(), { authorization: `Bearer ${token}` }),
      body: JSON.stringify({ acceptsNewOrders }),
    });
  }

  function transitionOrder(
    token: string,
    orderId: string,
    action: "accept" | "start-preparing" | "mark-ready" | "issue",
  ): Promise<Response> {
    return fetch(`${url}/api/v2/backoffice/orders/${orderId}/${action}`, {
      method: "POST",
      headers: headers(randomUUID(), { authorization: `Bearer ${token}` }),
    });
  }

  function createOrder(
    token: string | undefined,
    body: ReturnType<typeof orderBody>,
    key: string,
    requestId: string,
  ): Promise<Response> {
    return fetch(`${url}/api/v2/orders`, {
      method: "POST",
      headers: headers(requestId, {
        "idempotency-key": key,
        ...(token === undefined ? {} : { authorization: `Bearer ${token}` }),
      }),
      body: JSON.stringify(body),
    });
  }

  function getOrders(token: string, cursor?: string): Promise<Response> {
    const query = cursor === undefined ? '' : `?cursor=${encodeURIComponent(cursor)}`;
    return fetch(`${url}/api/v2/orders${query}`, {
      headers: headers('get-orders-request-id', { authorization: `Bearer ${token}` }),
    });
  }

  function getOrder(token: string | undefined, orderId: string, requestId: string): Promise<Response> {
    return fetch(`${url}/api/v2/orders/${orderId}`, {
      headers: headers(requestId, token === undefined ? {} : { authorization: `Bearer ${token}` }),
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
      `INSERT INTO products (id, category_id, type, name, description, price, sort_order) VALUES ($1, $2, 'DRINK', 'Капучино', 'Кофе с молоком', NULL, 10)`,
      [productId, categoryId],
    );
    await pool.query(
      `INSERT INTO product_variants (id, product_id, size, price, sort_order) VALUES ($1, $2, 'M', 320, 10)`,
      [variantId, productId],
    );
    await pool.query(
      `INSERT INTO modifier_groups (id, name, selection_type, min_select, max_select) VALUES ($1, 'Молоко', 'single', 1, 1)`,
      [groupId],
    );
    await pool.query(
      `INSERT INTO modifier_options (id, group_id, name, price_delta, sort_order, is_default) VALUES ($1, $2, 'Обычное', 0, 10, true)`,
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

  function runSeed(): void {
    execFileSync("npm", ["run", "seed"], {
      cwd: "./",
      env: process.env,
      stdio: "inherit",
    });
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
