import { execFileSync, spawnSync } from "node:child_process";
import { resolve } from "node:path";
import { Pool } from "pg";
import { e2eSeedIds, e2eSeedScenarios } from "../../scripts/seed.constants";
import type { E2eSeedScenario, SeedOrderStage } from "../../scripts/seed.types";

const databaseUrl = process.env.DATABASE_URL;
const externalProcessTimeoutMs = 60_000;
const customerPhone = "+79990000003";
const secondCustomerPhone = "+79990000004";
const staffPhone = "+79990000002";

interface BooleanRow {
  value: boolean;
}

interface CountRow {
  count: number;
}

interface OrderRow {
  id: string;
  number: string;
  owner: string;
  stage: SeedOrderStage;
  total: number;
}

interface ItemRow {
  number: string;
  productName: string;
  size: string | null;
  quantity: number;
  unitTotal: number;
  lineTotal: number;
}

interface ModifierRow {
  number: string;
  modifierOptionId: string;
  modifierName: string;
  priceDelta: number;
}

interface EventRow {
  id: string;
  number: string;
  actor: string;
  fromStage: SeedOrderStage;
  toStage: SeedOrderStage;
}

interface ScenarioState {
  customerCount: number;
  secondCustomerCount: number;
  otpCount: number;
  acceptsNewOrders: boolean;
  cappuccinoAvailable: boolean;
  cappuccinoActive: boolean;
  cappuccinoMediumAvailable: boolean;
  oatMilkAvailable: boolean;
  coffeeCategoryCurrent: boolean;
  unavailableDessertAvailable: boolean;
  orders: readonly OrderRow[];
  items: readonly ItemRow[];
  modifiers: readonly ModifierRow[];
  events: readonly EventRow[];
}

interface ScenarioExpectation {
  customerState: "new" | "existing";
  secondCustomerState: "new" | "existing";
  acceptsNewOrders: boolean;
  cappuccinoAvailable: boolean;
  cappuccinoMediumAvailable: boolean;
  oatMilkAvailable: boolean;
  stages: readonly SeedOrderStage[];
  includesForeignOrder: boolean;
  specialOrderState?: "archived-snapshot" | "unavailable" | "partial";
}

const scenarioExpectations: Readonly<
  Record<E2eSeedScenario, ScenarioExpectation>
> = {
  canonical: {
    customerState: "new",
    secondCustomerState: "new",
    acceptsNewOrders: true,
    cappuccinoAvailable: true,
    cappuccinoMediumAvailable: true,
    oatMilkAvailable: true,
    stages: [],
    includesForeignOrder: false,
  },
  "customer-new": {
    customerState: "new",
    secondCustomerState: "new",
    acceptsNewOrders: true,
    cappuccinoAvailable: true,
    cappuccinoMediumAvailable: true,
    oatMilkAvailable: true,
    stages: [],
    includesForeignOrder: false,
  },
  "customer-existing": {
    customerState: "existing",
    secondCustomerState: "existing",
    acceptsNewOrders: true,
    cappuccinoAvailable: true,
    cappuccinoMediumAvailable: true,
    oatMilkAvailable: true,
    stages: [],
    includesForeignOrder: false,
  },
  "intake-closed": {
    customerState: "existing",
    secondCustomerState: "existing",
    acceptsNewOrders: false,
    cappuccinoAvailable: true,
    cappuccinoMediumAvailable: true,
    oatMilkAvailable: true,
    stages: [],
    includesForeignOrder: false,
  },
  "modifier-unavailable": {
    customerState: "existing",
    secondCustomerState: "existing",
    acceptsNewOrders: true,
    cappuccinoAvailable: true,
    cappuccinoMediumAvailable: true,
    oatMilkAvailable: false,
    stages: [],
    includesForeignOrder: false,
  },
  "product-unavailable": {
    customerState: "existing",
    secondCustomerState: "existing",
    acceptsNewOrders: true,
    cappuccinoAvailable: false,
    cappuccinoMediumAvailable: true,
    oatMilkAvailable: true,
    stages: [],
    includesForeignOrder: false,
  },
  "size-unavailable": {
    customerState: "existing",
    secondCustomerState: "existing",
    acceptsNewOrders: true,
    cappuccinoAvailable: true,
    cappuccinoMediumAvailable: false,
    oatMilkAvailable: true,
    stages: [],
    includesForeignOrder: false,
  },
  "catalog-mutation": {
    customerState: "existing",
    secondCustomerState: "existing",
    acceptsNewOrders: true,
    cappuccinoAvailable: true,
    cappuccinoMediumAvailable: true,
    oatMilkAvailable: true,
    stages: [],
    includesForeignOrder: false,
  },
  "order-created": {
    customerState: "existing",
    secondCustomerState: "existing",
    acceptsNewOrders: true,
    cappuccinoAvailable: true,
    cappuccinoMediumAvailable: true,
    oatMilkAvailable: true,
    stages: ["CREATED"],
    includesForeignOrder: false,
  },
  "order-accepted": {
    customerState: "existing",
    secondCustomerState: "existing",
    acceptsNewOrders: true,
    cappuccinoAvailable: true,
    cappuccinoMediumAvailable: true,
    oatMilkAvailable: true,
    stages: ["ACCEPTED"],
    includesForeignOrder: false,
  },
  "order-preparing": {
    customerState: "existing",
    secondCustomerState: "existing",
    acceptsNewOrders: true,
    cappuccinoAvailable: true,
    cappuccinoMediumAvailable: true,
    oatMilkAvailable: true,
    stages: ["PREPARING"],
    includesForeignOrder: false,
  },
  "order-ready": {
    customerState: "existing",
    secondCustomerState: "existing",
    acceptsNewOrders: true,
    cappuccinoAvailable: true,
    cappuccinoMediumAvailable: true,
    oatMilkAvailable: true,
    stages: ["READY"],
    includesForeignOrder: false,
  },
  "order-issued": {
    customerState: "existing",
    secondCustomerState: "existing",
    acceptsNewOrders: true,
    cappuccinoAvailable: true,
    cappuccinoMediumAvailable: true,
    oatMilkAvailable: true,
    stages: ["ISSUED"],
    includesForeignOrder: false,
  },
  "order-snapshot": {
    customerState: "existing",
    secondCustomerState: "existing",
    acceptsNewOrders: true,
    cappuccinoAvailable: true,
    cappuccinoMediumAvailable: true,
    oatMilkAvailable: true,
    stages: ["CREATED"],
    includesForeignOrder: false,
    specialOrderState: "archived-snapshot",
  },
  "order-repeat-unavailable": {
    customerState: "existing",
    secondCustomerState: "existing",
    acceptsNewOrders: true,
    cappuccinoAvailable: false,
    cappuccinoMediumAvailable: true,
    oatMilkAvailable: true,
    stages: ["ISSUED"],
    includesForeignOrder: false,
    specialOrderState: "unavailable",
  },
  "order-repeat-partial": {
    customerState: "existing",
    secondCustomerState: "existing",
    acceptsNewOrders: true,
    cappuccinoAvailable: true,
    cappuccinoMediumAvailable: true,
    oatMilkAvailable: true,
    stages: ["ISSUED"],
    includesForeignOrder: false,
    specialOrderState: "partial",
  },
  "customer-history": {
    customerState: "existing",
    secondCustomerState: "existing",
    acceptsNewOrders: true,
    cappuccinoAvailable: true,
    cappuccinoMediumAvailable: true,
    oatMilkAvailable: true,
    stages: [
      "ISSUED",
      "ISSUED",
      "ISSUED",
      "ISSUED",
      "ISSUED",
      "ISSUED",
      "ISSUED",
      "ISSUED",
      "ISSUED",
      "ISSUED",
      "ISSUED",
      "ISSUED",
      "ISSUED",
      "ISSUED",
      "ISSUED",
      "ISSUED",
      "ISSUED",
      "ISSUED",
      "ISSUED",
      "ISSUED",
      "ISSUED",
      "ISSUED",
    ],
    includesForeignOrder: true,
  },
  "queue-populated": {
    customerState: "existing",
    secondCustomerState: "existing",
    acceptsNewOrders: true,
    cappuccinoAvailable: true,
    cappuccinoMediumAvailable: true,
    oatMilkAvailable: true,
    stages: ["CREATED", "ACCEPTED", "PREPARING", "READY", "ISSUED"],
    includesForeignOrder: false,
  },
};

function runScript(script: "migrate" | "seed", scenario?: string): void {
  execFileSync("npm", ["run", script], {
    cwd: resolve(__dirname, "../.."),
    env: {
      ...process.env,
      JEST_WORKER_ID: undefined,
      NODE_ENV: "local",
      PORT: "3000",
      DATABASE_URL: databaseUrl,
      AUTH_ACCESS_TOKEN_SECRET: "e2e-seed-scenario-placeholder-secret",
      AUTH_OTP_PEPPER: "e2e-seed-scenario-otp-pepper",
      AUTH_DEVELOPMENT_OTP: "123456",
      CORS_ORIGINS: "http://localhost:5173",
      VAPID_SUBJECT: "mailto:e2e-seed@expressa.test",
      VAPID_PUBLIC_KEY:
        "BOT-VsrivTqPsMDCzS45APlNSMbgcTT5jqlrYu2-6PCRGB0YneXQDNsbrIxTAy0jJ-kUlKlWPm94PeirK8A8wCw",
      VAPID_PRIVATE_KEY: "9rZGGVplNbc2psiiiyOla_ZL-qDyrgIZqD_cpLz1G0c",
      E2E_CUSTOMER_PHONE: customerPhone,
      E2E_CUSTOMER_2_PHONE: secondCustomerPhone,
      E2E_STAFF_PHONE: staffPhone,
      ...(scenario === undefined ? {} : { E2E_SEED_SCENARIO: scenario }),
    },
    stdio: "inherit",
  });
}

function runInvalidSeed(): string {
  const result = spawnSync("npm", ["run", "seed"], {
    cwd: resolve(__dirname, "../.."),
    env: {
      ...process.env,
      JEST_WORKER_ID: undefined,
      NODE_ENV: "local",
      PORT: "3000",
      DATABASE_URL: databaseUrl,
      AUTH_ACCESS_TOKEN_SECRET: "e2e-seed-scenario-placeholder-secret",
      AUTH_OTP_PEPPER: "e2e-seed-scenario-otp-pepper",
      AUTH_DEVELOPMENT_OTP: "123456",
      CORS_ORIGINS: "http://localhost:5173",
      VAPID_SUBJECT: "mailto:e2e-seed@expressa.test",
      VAPID_PUBLIC_KEY:
        "BOT-VsrivTqPsMDCzS45APlNSMbgcTT5jqlrYu2-6PCRGB0YneXQDNsbrIxTAy0jJ-kUlKlWPm94PeirK8A8wCw",
      VAPID_PRIVATE_KEY: "9rZGGVplNbc2psiiiyOla_ZL-qDyrgIZqD_cpLz1G0c",
      E2E_CUSTOMER_PHONE: customerPhone,
      E2E_CUSTOMER_2_PHONE: secondCustomerPhone,
      E2E_STAFF_PHONE: staffPhone,
      E2E_SEED_SCENARIO: "unknown",
    },
    encoding: "utf8",
  });
  expect(result.status).not.toBe(0);
  return `${result.stdout}\n${result.stderr}`;
}

async function resetDatabase(pool: Pool): Promise<void> {
  await pool.query(
    `TRUNCATE order_item_modifiers, order_items, order_events, orders, order_daily_counters, audit_events,
      push_subscriptions, sessions, otp_challenges, service_settings, users, category_modifier_groups, modifier_options,
      modifier_groups, product_variants, products, categories RESTART IDENTITY`,
  );
  await pool.query(
    `INSERT INTO service_settings (key, value) VALUES ('accepts_new_orders', true)`,
  );
}

async function provisionRunnerLikeUsers(pool: Pool): Promise<void> {
  await pool.query(
    `INSERT INTO users (phone_e164, role) VALUES ($1, 'customer'), ($2, 'customer')`,
    [customerPhone, secondCustomerPhone],
  );
  await pool.query(
    `INSERT INTO otp_challenges (phone_e164, code_hash, expires_at)
     VALUES ($1, 'runner-otp', CURRENT_TIMESTAMP + INTERVAL '1 hour'),
       ($2, 'runner-otp', CURRENT_TIMESTAMP + INTERVAL '1 hour')`,
    [customerPhone, secondCustomerPhone],
  );
}

async function readCount(
  pool: Pool,
  sql: string,
  values: unknown[] = [],
): Promise<number> {
  const result = await pool.query<CountRow>(sql, values);
  const value = result.rows[0]?.count;
  if (typeof value !== "number")
    throw new Error("E2E seed count was not read.");
  return value;
}

async function readBoolean(
  pool: Pool,
  sql: string,
  values: unknown[] = [],
): Promise<boolean> {
  const result = await pool.query<BooleanRow>(sql, values);
  const value = result.rows[0]?.value;
  if (typeof value !== "boolean")
    throw new Error("E2E seed boolean was not read.");
  return value;
}

async function readScenarioState(pool: Pool): Promise<ScenarioState> {
  const [orders, items, modifiers, events] = await Promise.all([
    pool.query<OrderRow>(
      `SELECT orders.id, orders.number, users.phone_e164 AS owner, orders.stage,
              orders.total
       FROM orders JOIN users ON users.id = orders.customer_id ORDER BY orders.number`,
    ),
    pool.query<ItemRow>(
      `SELECT orders.number, order_items.product_name AS "productName", order_items.size,
              order_items.quantity, order_items.unit_total AS "unitTotal",
              order_items.line_total AS "lineTotal"
       FROM order_items JOIN orders ON orders.id = order_items.order_id
       ORDER BY orders.number, order_items.sort_order`,
    ),
    pool.query<ModifierRow>(
      `SELECT orders.number, order_item_modifiers.modifier_option_id AS "modifierOptionId",
              order_item_modifiers.modifier_name AS "modifierName",
              order_item_modifiers.price_delta AS "priceDelta"
       FROM order_item_modifiers JOIN order_items ON order_items.id = order_item_modifiers.order_item_id
       JOIN orders ON orders.id = order_items.order_id
       ORDER BY orders.number, order_item_modifiers.sort_order`,
    ),
    pool.query<EventRow>(
      `SELECT order_events.id, orders.number, users.phone_e164 AS actor,
              order_events.from_stage AS "fromStage", order_events.to_stage AS "toStage"
       FROM order_events JOIN orders ON orders.id = order_events.order_id
       JOIN users ON users.id = order_events.actor_id
       ORDER BY orders.number, order_events.occurred_at, order_events.id`,
    ),
  ]);
  return {
    customerCount: await readCount(
      pool,
      `SELECT count(*)::int AS count FROM users WHERE phone_e164 = $1`,
      [customerPhone],
    ),
    secondCustomerCount: await readCount(
      pool,
      `SELECT count(*)::int AS count FROM users WHERE phone_e164 = $1`,
      [secondCustomerPhone],
    ),
    otpCount: await readCount(
      pool,
      `SELECT count(*)::int AS count FROM otp_challenges WHERE phone_e164 = ANY($1::text[])`,
      [[customerPhone, secondCustomerPhone]],
    ),
    acceptsNewOrders: await readBoolean(
      pool,
      `SELECT value FROM service_settings WHERE key = 'accepts_new_orders'`,
    ),
    cappuccinoAvailable: await readBoolean(
      pool,
      `SELECT is_available AS value FROM products WHERE id = $1`,
      [e2eSeedIds.cappuccino],
    ),
    cappuccinoActive: await readBoolean(
      pool,
      `SELECT is_active AS value FROM products WHERE id = $1`,
      [e2eSeedIds.cappuccino],
    ),
    cappuccinoMediumAvailable: await readBoolean(
      pool,
      `SELECT is_available AS value FROM product_variants WHERE id = $1`,
      [e2eSeedIds.cappuccinoMedium],
    ),
    oatMilkAvailable: await readBoolean(
      pool,
      `SELECT is_available AS value FROM modifier_options WHERE id = $1`,
      [e2eSeedIds.oatMilk],
    ),
    coffeeCategoryCurrent: await readBoolean(
      pool,
      `SELECT (archived_at IS NULL) AS value FROM categories WHERE id = $1`,
      [e2eSeedIds.coffeeCategory],
    ),
    unavailableDessertAvailable: await readBoolean(
      pool,
      `SELECT is_available AS value FROM products WHERE id = $1`,
      [e2eSeedIds.unavailableDessert],
    ),
    orders: orders.rows,
    items: items.rows,
    modifiers: modifiers.rows,
    events: events.rows,
  };
}

function seedId(index: number): string {
  return `00000000-0000-4000-8000-${index.toString().padStart(12, "0")}`;
}

function orderNumber(index: number): string {
  return `20300102-${index.toString().padStart(3, "0")}`;
}

function stageTransitions(
  stage: SeedOrderStage,
): readonly [SeedOrderStage, SeedOrderStage][] {
  const transitions: Readonly<
    Record<SeedOrderStage, readonly [SeedOrderStage, SeedOrderStage][]>
  > = {
    CREATED: [],
    ACCEPTED: [["CREATED", "ACCEPTED"]],
    PREPARING: [
      ["CREATED", "ACCEPTED"],
      ["ACCEPTED", "PREPARING"],
    ],
    READY: [
      ["CREATED", "ACCEPTED"],
      ["ACCEPTED", "PREPARING"],
      ["PREPARING", "READY"],
    ],
    ISSUED: [
      ["CREATED", "ACCEPTED"],
      ["ACCEPTED", "PREPARING"],
      ["PREPARING", "READY"],
      ["READY", "ISSUED"],
    ],
  };
  return transitions[stage];
}

function assertScenarioState(
  expectation: ScenarioExpectation,
  state: ScenarioState,
): void {
  expect(state.customerCount).toBe(
    expectation.customerState === "existing" ? 1 : 0,
  );
  expect(state.secondCustomerCount).toBe(
    expectation.secondCustomerState === "existing" ? 1 : 0,
  );
  expect(state.otpCount).toBe(0);
  expect(state.acceptsNewOrders).toBe(expectation.acceptsNewOrders);
  expect(state.cappuccinoAvailable).toBe(expectation.cappuccinoAvailable);
  expect(state.cappuccinoMediumAvailable).toBe(
    expectation.cappuccinoMediumAvailable,
  );
  expect(state.oatMilkAvailable).toBe(expectation.oatMilkAvailable);
  expect(state.cappuccinoActive).toBe(
    expectation.specialOrderState !== "archived-snapshot",
  );
  expect(state.coffeeCategoryCurrent).toBe(
    expectation.specialOrderState !== "archived-snapshot",
  );
  expect(state.unavailableDessertAvailable).toBe(false);
  expect(state.orders).toEqual(
    expectation.stages.map((stage, index) => ({
      id: seedId(index + 1),
      number: orderNumber(index + 1),
      owner:
        expectation.includesForeignOrder &&
        index === expectation.stages.length - 1
          ? secondCustomerPhone
          : customerPhone,
      stage,
      total: expectation.specialOrderState === "partial" ? 600 : 320,
    })),
  );
  expect(state.items).toEqual([
    ...expectation.stages.map((_, index) => ({
      number: orderNumber(index + 1),
      productName: "Капучино",
      size: "M",
      quantity: 1,
      unitTotal: 320,
      lineTotal: 320,
    })),
    ...(expectation.specialOrderState === "partial"
      ? [
          {
            number: orderNumber(1),
            productName: "Чизкейк",
            size: null,
            quantity: 1,
            unitTotal: 280,
            lineTotal: 280,
          },
        ]
      : []),
  ]);
  expect(state.modifiers).toEqual(
    expectation.stages.map((_, index) => ({
      number: orderNumber(index + 1),
      modifierOptionId: e2eSeedIds.regularMilk,
      modifierName: "Обычное молоко",
      priceDelta: 0,
    })),
  );
  expect(state.events).toEqual(
    expectation.stages.flatMap((stage, orderIndex) =>
      stageTransitions(stage).map(([fromStage, toStage], eventIndex) => ({
        id: seedId(3_000 + (orderIndex + 1) * 10 + eventIndex + 1),
        number: orderNumber(orderIndex + 1),
        actor: staffPhone,
        fromStage,
        toStage,
      })),
    ),
  );
}

describe("E2E scenario seed", () => {
  let pool: Pool;

  beforeAll(() => {
    if (databaseUrl === undefined)
      throw new Error("DATABASE_URL is required for integration tests");
    pool = new Pool({ connectionString: databaseUrl });
    runScript("migrate");
  });

  beforeEach(async () => {
    await resetDatabase(pool);
    await provisionRunnerLikeUsers(pool);
  });

  afterAll(async () => {
    await pool?.end();
  });

  it("declares every exported scenario explicitly", () => {
    expect(Object.keys(scenarioExpectations).sort()).toEqual(
      [...e2eSeedScenarios].sort(),
    );
  });

  it.each(e2eSeedScenarios)(
    "seeds and repeats %s deterministically",
    async (scenarioName) => {
      const expectation = scenarioExpectations[scenarioName];
      runScript("seed", scenarioName);
      const firstState = await readScenarioState(pool);
      assertScenarioState(expectation, firstState);

      runScript("seed", scenarioName);
      expect(await readScenarioState(pool)).toEqual(firstState);
    },
    externalProcessTimeoutMs,
  );

  it(
    "rejects an unknown scenario before mutating the prepared database",
    async () => {
      runScript("seed", "canonical");
      const stateBefore = await readScenarioState(pool);
      expect(runInvalidSeed()).toContain("E2E_SEED_SCENARIO must be one of:");
      expect(await readScenarioState(pool)).toEqual(stateBefore);
    },
    externalProcessTimeoutMs,
  );
});
