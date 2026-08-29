import { Pool } from "pg";
import { validateEnvironment } from "../src/platform/config/environment";
import {
  catalogSeed,
  categoryModifierGroupUpsertSql,
  categoryUpsertSql,
  e2eSeedIds,
  e2eSeedScenarioDefinitions,
  e2eSeedScenarioEnvironmentVariable,
  e2eSeedScenarios,
  modifierGroupUpsertSql,
  modifierOptionUpsertSql,
  productUpsertSql,
  productVariantUpsertSql,
} from "./seed.constants";
import type {
  E2eSeedScenario,
  E2eSeedScenarioDefinition,
  SeedOrderStage,
} from "./seed.types";

const seededOrderDay = "2030-01-02";

interface UserRow {
  id: string;
}

async function seedCatalog(pool: Pool): Promise<void> {
  for (const category of catalogSeed.categories) {
    await pool.query(categoryUpsertSql, [
      category.id,
      category.name,
      category.description,
      category.sortOrder,
      category.isActive,
    ]);
  }

  for (const modifierGroup of catalogSeed.modifierGroups) {
    await pool.query(modifierGroupUpsertSql, [
      modifierGroup.id,
      modifierGroup.name,
      modifierGroup.selectionType,
      modifierGroup.minSelect,
      modifierGroup.maxSelect,
      modifierGroup.isActive,
    ]);
  }

  for (const product of catalogSeed.products) {
    await pool.query(productUpsertSql, [
      product.id,
      product.categoryId,
      product.type,
      product.name,
      product.description,
      product.price,
      product.sortOrder,
      product.isActive,
      product.isAvailable,
    ]);
  }

  for (const productVariant of catalogSeed.productVariants) {
    await pool.query(productVariantUpsertSql, [
      productVariant.id,
      productVariant.productId,
      productVariant.size,
      productVariant.price,
      productVariant.sortOrder,
      productVariant.isAvailable,
    ]);
  }

  for (const modifierOption of catalogSeed.modifierOptions) {
    await pool.query(modifierOptionUpsertSql, [
      modifierOption.id,
      modifierOption.groupId,
      modifierOption.name,
      modifierOption.priceDelta,
      modifierOption.sortOrder,
      modifierOption.isDefault,
      modifierOption.isAvailable,
    ]);
  }

  for (const categoryModifierGroup of catalogSeed.categoryModifierGroups) {
    await pool.query(categoryModifierGroupUpsertSql, [
      categoryModifierGroup.categoryId,
      categoryModifierGroup.groupId,
      categoryModifierGroup.sortOrder,
    ]);
  }
}

function readE2eSeedScenario(
  environment: NodeJS.ProcessEnv,
): E2eSeedScenario | null {
  const value = environment[e2eSeedScenarioEnvironmentVariable];
  if (value === undefined) return null;
  if ((e2eSeedScenarios as readonly string[]).includes(value))
    return value as E2eSeedScenario;
  throw new Error(
    `${e2eSeedScenarioEnvironmentVariable} must be one of: ${e2eSeedScenarios.join(", ")}.`,
  );
}

function readRequiredEnvironment(
  environment: NodeJS.ProcessEnv,
  name: string,
): string {
  const value = environment[name];
  if (value === undefined || value === "")
    throw new Error(`${name} is required for E2E seed scenario.`);
  return value;
}

async function upsertUser(
  pool: Pool,
  phone: string,
  role: "customer" | "barista",
): Promise<string> {
  const result = await pool.query<UserRow>(
    `INSERT INTO users (phone_e164, role) VALUES ($1, $2)
     ON CONFLICT (phone_e164) DO UPDATE SET role = EXCLUDED.role, updated_at = CURRENT_TIMESTAMP
     RETURNING id`,
    [phone, role],
  );
  const row = result.rows[0];
  if (row === undefined || typeof row.id !== "string")
    throw new Error("E2E seed user was not returned.");
  return row.id;
}

async function clearOtpChallenges(
  pool: Pool,
  phones: readonly string[],
): Promise<void> {
  await pool.query(
    "DELETE FROM otp_challenges WHERE phone_e164 = ANY($1::text[])",
    [phones],
  );
}

async function applyScenarioCatalogState(
  pool: Pool,
  scenario: E2eSeedScenarioDefinition,
): Promise<void> {
  await pool.query(
    `UPDATE service_settings SET value = $1, updated_by = NULL, updated_at = NULL
     WHERE key = 'accepts_new_orders'`,
    [scenario.acceptsNewOrders],
  );

  if (scenario.unavailableTarget === "modifier") {
    await pool.query(
      "UPDATE modifier_options SET is_available = false WHERE id = $1",
      [e2eSeedIds.oatMilk],
    );
  }
  if (scenario.unavailableTarget === "product") {
    await pool.query("UPDATE products SET is_available = false WHERE id = $1", [
      e2eSeedIds.cappuccino,
    ]);
  }
  if (scenario.unavailableTarget === "size") {
    await pool.query(
      "UPDATE product_variants SET is_available = false WHERE id = $1",
      [e2eSeedIds.cappuccinoMedium],
    );
  }
}

function seedOrderId(index: number): string {
  return `00000000-0000-4000-8000-${index.toString().padStart(12, "0")}`;
}

function seedOrderNumber(index: number): string {
  return `20300102-${index.toString().padStart(3, "0")}`;
}

function stagePath(stage: SeedOrderStage): readonly SeedOrderStage[] {
  const stages: readonly SeedOrderStage[] = [
    "CREATED",
    "ACCEPTED",
    "PREPARING",
    "READY",
    "ISSUED",
  ];
  return stages.slice(0, stages.indexOf(stage) + 1);
}

async function seedOrder(
  pool: Pool,
  index: number,
  customerId: string,
  staffId: string,
  stage: SeedOrderStage,
): Promise<void> {
  const orderId = seedOrderId(index);
  const createdAt = new Date(
    `2030-01-02T00:${index.toString().padStart(2, "0")}:00.000Z`,
  );
  await pool.query("DELETE FROM order_events WHERE order_id = $1", [orderId]);
  await pool.query("DELETE FROM order_items WHERE order_id = $1", [orderId]);
  await pool.query(
    `INSERT INTO orders (
       id, number, customer_id, idempotency_key, request_fingerprint, stage, total, order_day, daily_number, created_at
     ) VALUES ($1, $2, $3, $4, $5, $6, 320, $7, $8, $9)
     ON CONFLICT (id) DO UPDATE SET
       number = EXCLUDED.number,
       customer_id = EXCLUDED.customer_id,
       idempotency_key = EXCLUDED.idempotency_key,
       request_fingerprint = EXCLUDED.request_fingerprint,
       stage = EXCLUDED.stage,
       total = EXCLUDED.total,
       order_day = EXCLUDED.order_day,
       daily_number = EXCLUDED.daily_number,
       created_at = EXCLUDED.created_at`,
    [
      orderId,
      seedOrderNumber(index),
      customerId,
      seedOrderId(1_000 + index),
      `e2e-seed-${index}`,
      stage,
      seededOrderDay,
      index,
      createdAt,
    ],
  );
  const itemId = seedOrderId(2_000 + index);
  await pool.query(
    `INSERT INTO order_items (
       id, order_id, product_id, variant_id, product_name, size, quantity, unit_total, line_total, sort_order
     ) VALUES ($1, $2, $3, $4, 'Капучино', 'M', 1, 320, 320, 0)`,
    [itemId, orderId, e2eSeedIds.cappuccino, e2eSeedIds.cappuccinoMedium],
  );
  await pool.query(
    `INSERT INTO order_item_modifiers (
       order_item_id, modifier_option_id, modifier_name, price_delta, sort_order
     ) VALUES ($1, $2, 'Обычное молоко', 0, 0)`,
    [itemId, e2eSeedIds.regularMilk],
  );

  const path = stagePath(stage);
  for (const [eventIndex, toStage] of path.entries()) {
    if (toStage === "CREATED") continue;
    const fromStage = path[eventIndex - 1];
    if (fromStage === undefined)
      throw new Error("E2E seed order stage path is invalid.");
    await pool.query(
      `INSERT INTO order_events (id, order_id, actor_id, occurred_at, from_stage, to_stage)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        seedOrderId(3_000 + index * 10 + eventIndex),
        orderId,
        staffId,
        new Date(createdAt.getTime() + eventIndex * 1_000),
        fromStage,
        toStage,
      ],
    );
  }
}

async function addPartialRepeatItem(pool: Pool): Promise<void> {
  const orderId = seedOrderId(1);
  await pool.query("UPDATE orders SET total = 600 WHERE id = $1", [
    orderId,
  ]);
  await pool.query(
    `INSERT INTO order_items (
       id, order_id, product_id, variant_id, product_name, size, quantity, unit_total, line_total, sort_order
     ) VALUES ($1, $2, $3, NULL, 'Чизкейк', NULL, 1, 280, 280, 1)`,
    [seedOrderId(4_001), orderId, e2eSeedIds.unavailableDessert],
  );
}

async function seedOrders(
  pool: Pool,
  scenario: E2eSeedScenarioDefinition,
  customerId: string,
  secondCustomerId: string,
  staffId: string,
): Promise<void> {
  let orderIndex = 1;
  for (const stage of scenario.orderStages) {
    await seedOrder(pool, orderIndex, customerId, staffId, stage);
    orderIndex += 1;
  }
  for (let index = 0; index < scenario.customerHistoryCount; index += 1) {
    await seedOrder(pool, orderIndex, customerId, staffId, "ISSUED");
    orderIndex += 1;
  }
  if (scenario.includeForeignOrder) {
    await seedOrder(pool, orderIndex, secondCustomerId, staffId, "ISSUED");
    orderIndex += 1;
  }

  if (orderIndex > 1) {
    await pool.query(
      `INSERT INTO order_daily_counters (order_day, last_number) VALUES ($1, $2)
       ON CONFLICT (order_day) DO UPDATE SET last_number = GREATEST(order_daily_counters.last_number, EXCLUDED.last_number)`,
      [seededOrderDay, orderIndex - 1],
    );
  }
}

async function seedE2eScenario(
  pool: Pool,
  scenarioName: E2eSeedScenario,
  environment: NodeJS.ProcessEnv,
): Promise<void> {
  const scenario = e2eSeedScenarioDefinitions[scenarioName];
  const customerPhone = readRequiredEnvironment(
    environment,
    "E2E_CUSTOMER_PHONE",
  );
  const secondCustomerPhone = readRequiredEnvironment(
    environment,
    "E2E_CUSTOMER_2_PHONE",
  );
  const customerPhones = [customerPhone, secondCustomerPhone];
  await clearOtpChallenges(pool, customerPhones);

  if (
    scenario.customerState === "new" &&
    scenario.secondCustomerState === "new"
  ) {
    await pool.query("DELETE FROM users WHERE phone_e164 = ANY($1::text[])", [
      customerPhones,
    ]);
  }

  await applyScenarioCatalogState(pool, scenario);
  if (scenario.customerState === "new") return;

  const customerId = await upsertUser(pool, customerPhone, "customer");
  const secondCustomerId =
    scenario.secondCustomerState === "existing"
      ? await upsertUser(pool, secondCustomerPhone, "customer")
      : customerId;
  const staffId = await upsertUser(
    pool,
    readRequiredEnvironment(environment, "E2E_STAFF_PHONE"),
    "barista",
  );
  await seedOrders(pool, scenario, customerId, secondCustomerId, staffId);
  if (scenarioName === "order-snapshot") {
    await pool.query("UPDATE products SET is_active = false WHERE id = $1", [
      e2eSeedIds.cappuccino,
    ]);
    await pool.query(
      "UPDATE categories SET archived_at = '2030-01-03T00:00:00.000Z' WHERE id = $1",
      [e2eSeedIds.coffeeCategory],
    );
  }
  if (scenarioName === "order-repeat-unavailable") {
    await pool.query("UPDATE products SET is_available = false WHERE id = $1", [
      e2eSeedIds.cappuccino,
    ]);
  }
  if (scenarioName === "order-repeat-partial") {
    await addPartialRepeatItem(pool);
  }
}

async function main(): Promise<void> {
  validateEnvironment(process.env);
  const scenario = readE2eSeedScenario(process.env);

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  try {
    await pool.query("SELECT 1 FROM schema_migrations LIMIT 1");
    const phone = process.env.BOOTSTRAP_ADMIN_PHONE;
    if (phone !== undefined && phone !== "") {
      await pool.query(
        `INSERT INTO users (phone_e164, role) VALUES ($1, 'administrator')
         ON CONFLICT (phone_e164) DO UPDATE
         SET role = EXCLUDED.role, updated_at = CURRENT_TIMESTAMP`,
        [phone],
      );
    }

    await seedCatalog(pool);
    if (scenario !== null) await seedE2eScenario(pool, scenario, process.env);
  } finally {
    await pool.end();
  }
}

void main();
