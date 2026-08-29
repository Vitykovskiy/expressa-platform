import { Pool } from "pg";

import { frontOfficeE2eDatabaseUrl } from "../../playwright.config.constants";
import {
  acceptsNewOrdersSettingKey,
  checkoutSeedIds,
} from "./checkout.database.constants";
import type {
  CheckoutOrderStage,
  CheckoutDatabaseState,
  IssuedHistoryOrder,
  IssuedHistoryOrderQuery,
  OrderRow,
  OrderRowQuery,
} from "./checkout.database.types";

export class CheckoutDatabase {
  readonly #pool = new Pool({ connectionString: frontOfficeE2eDatabaseUrl });

  async close(): Promise<void> {
    await this.#pool.end();
  }

  async readState(): Promise<CheckoutDatabaseState> {
    const result = await this.#pool.query<CheckoutDatabaseState>(
      `SELECT products.is_available AS "productAvailable", variants.is_available AS "variantAvailable", options.is_available AS "modifierAvailable", variants.price AS "variantPrice", settings.value AS "acceptsNewOrders"
       FROM products
       JOIN product_variants variants ON variants.id = $1
       JOIN modifier_options options ON options.id = $2
       JOIN service_settings settings ON settings.key = $3
       WHERE products.id = $4`,
      [
        checkoutSeedIds.cappuccinoVariantM,
        checkoutSeedIds.milkOption,
        acceptsNewOrdersSettingKey,
        checkoutSeedIds.cappuccinoProduct,
      ],
    );
    const row = requireSingleRow(result.rows, "Состояние checkout seed");
    if (!Number.isSafeInteger(row.variantPrice) || row.variantPrice < 0)
      throw new Error("Цена checkout seed некорректна.");
    return row;
  }

  async restore(state: CheckoutDatabaseState): Promise<void> {
    await this.setProductAvailable(state.productAvailable);
    await this.setVariantAvailable(state.variantAvailable);
    await this.setModifierAvailable(state.modifierAvailable);
    await this.setVariantPrice(state.variantPrice);
    await this.setAcceptsNewOrders(state.acceptsNewOrders);
  }

  async setProductAvailable(value: boolean): Promise<void> {
    await this.#update(
      "products",
      "is_available",
      value,
      "id",
      checkoutSeedIds.cappuccinoProduct,
    );
  }
  async setVariantAvailable(value: boolean): Promise<void> {
    await this.#update(
      "product_variants",
      "is_available",
      value,
      "id",
      checkoutSeedIds.cappuccinoVariantM,
    );
  }
  async setModifierAvailable(value: boolean): Promise<void> {
    await this.#update(
      "modifier_options",
      "is_available",
      value,
      "id",
      checkoutSeedIds.milkOption,
    );
  }
  async setAcceptsNewOrders(value: boolean): Promise<void> {
    await this.#update(
      "service_settings",
      "value",
      value,
      "key",
      acceptsNewOrdersSettingKey,
    );
  }

  async setVariantPrice(value: number): Promise<void> {
    if (!Number.isSafeInteger(value) || value < 0)
      throw new Error("Цена должна быть неотрицательным целым числом.");
    await this.#update(
      "product_variants",
      "price",
      value,
      "id",
      checkoutSeedIds.cappuccinoVariantM,
    );
  }

  async countOrders(
    customerId: string,
    idempotencyKey: string,
  ): Promise<number> {
    const result = await this.#pool.query<{ count: string }>(
      "SELECT count(*) FROM orders WHERE customer_id = $1 AND idempotency_key = $2",
      [customerId, idempotencyKey],
    );
    const count = Number(
      requireSingleRow(result.rows, "Количество заказов").count,
    );
    if (!Number.isSafeInteger(count) || count < 0)
      throw new Error("Количество заказов некорректно.");
    return count;
  }

  async countOrdersForCustomer(customerId: string): Promise<number> {
    const result = await this.#pool.query<{ count: string }>(
      "SELECT count(*) FROM orders WHERE customer_id = $1",
      [customerId],
    );
    const count = Number(
      requireSingleRow(result.rows, "Количество заказов customer").count,
    );
    if (!Number.isSafeInteger(count) || count < 0)
      throw new Error("Количество заказов customer некорректно.");
    return count;
  }

  async readOrder(
    customerId: string,
    idempotencyKey: string,
  ): Promise<OrderRow | null> {
    const result = await this.#pool.query<OrderRowQuery>(
      `SELECT orders.id,
              orders.idempotency_key AS "idempotencyKey",
              orders.number AS "orderNumber",
              orders.total AS "total",
              COALESCE(SUM(order_items.quantity), 0)::integer AS quantity
       FROM orders
       LEFT JOIN order_items ON order_items.order_id = orders.id
       WHERE orders.customer_id = $1 AND orders.idempotency_key = $2
       GROUP BY orders.id`,
      [customerId, idempotencyKey],
    );
    if (result.rows.length === 0) return null;
    const row = requireSingleRow(result.rows, "Заказ");
    return {
      id: requireNonEmptyString(row.id, "id заказа"),
      idempotencyKey: requireNonEmptyString(
        row.idempotencyKey,
        "idempotency key заказа",
      ),
      orderNumber: requireNonEmptyString(row.orderNumber, "номер заказа"),
      quantity: requirePositiveInteger(row.quantity, "Количество заказа"),
      total: requireNonNegativeInteger(row.total, "Сумма заказа"),
    };
  }

  async setOrderStage(
    orderId: string,
    stage: CheckoutOrderStage,
  ): Promise<void> {
    await this.#update("orders", "stage", stage, "id", orderId);
  }

  async createIssuedHistory(
    customerId: string,
    sourceOrderId: string,
  ): Promise<readonly IssuedHistoryOrder[]> {
    const result = await this.#pool.query<IssuedHistoryOrderQuery>(
      `WITH history_orders AS (
         INSERT INTO orders (
           id, number, customer_id, idempotency_key, request_fingerprint,
           stage, total, order_day, daily_number, created_at
         )
         SELECT
           ('00000000-0000-4000-8000-' || lpad((200 + sequence)::text, 12, '0'))::uuid,
           to_char(DATE '2001-01-01' + sequence, 'YYYYMMDD') || '-001',
           $1,
           ('00000000-0000-4000-8000-' || lpad((300 + sequence)::text, 12, '0'))::uuid,
           'checkout-e2e-issued-history',
           'ISSUED',
           source.total,
           DATE '2001-01-01' + sequence,
           1,
           (DATE '2001-01-01' + sequence)::timestamptz
         FROM generate_series(1, 20) AS sequence
         JOIN orders source ON source.id = $2 AND source.customer_id = $1
         RETURNING id, number AS "orderNumber"
       ), inserted_items AS (
         INSERT INTO order_items (
           id, order_id, sort_order, product_id, variant_id, product_name,
           size, quantity, unit_total, line_total
         )
         SELECT
           gen_random_uuid(), history_orders.id, source.sort_order,
           source.product_id, source.variant_id, source.product_name,
           source.size, source.quantity, source.unit_total,
           source.line_total
         FROM history_orders
         JOIN order_items source ON source.order_id = $2
       )
       SELECT id, "orderNumber" FROM history_orders ORDER BY "orderNumber" DESC`,
      [customerId, sourceOrderId],
    );
    if (result.rows.length !== 20)
      throw new Error(
        `История checkout seed: ожидалось 20 строк, получено ${result.rows.length}.`,
      );
    return result.rows.map((row) => ({
      id: requireNonEmptyString(row.id, "id истории заказа"),
      orderNumber: requireNonEmptyString(
        row.orderNumber,
        "номер истории заказа",
      ),
    }));
  }

  async deleteOrders(orderIds: readonly string[]): Promise<void> {
    if (orderIds.length === 0) return;
    const result = await this.#pool.query(
      "DELETE FROM orders WHERE id = ANY($1::uuid[])",
      [orderIds],
    );
    if (result.rowCount !== orderIds.length)
      throw new Error(
        `Очистка checkout history затронула ${result.rowCount} из ${orderIds.length} строк.`,
      );
  }

  async #update(
    table:
      | "products"
      | "product_variants"
      | "modifier_options"
      | "service_settings"
      | "orders",
    column: "is_available" | "price" | "stage" | "value",
    value: boolean | number | CheckoutOrderStage,
    key: "id" | "key",
    identifier: string,
  ): Promise<void> {
    const result = await this.#pool.query(
      `UPDATE ${table} SET ${column} = $1 WHERE ${key} = $2`,
      [value, identifier],
    );
    if (result.rowCount !== 1)
      throw new Error(`Изменение ${table} затронуло ${result.rowCount} строк.`);
  }
}

function requireSingleRow<Row>(rows: readonly Row[], label: string): Row {
  if (rows.length !== 1)
    throw new Error(
      `${label}: ожидалась одна строка, получено ${rows.length}.`,
    );
  return rows[0]!;
}

function requireNonEmptyString(value: unknown, label: string): string {
  if (typeof value !== "string" || value.trim() === "")
    throw new Error(`${label} некорректен.`);
  return value;
}

function requireNonNegativeInteger(value: unknown, label: string): number {
  if (!Number.isSafeInteger(value) || value < 0)
    throw new Error(`${label} некорректна.`);
  return value;
}

function requirePositiveInteger(value: unknown, label: string): number {
  if (!Number.isSafeInteger(value) || value < 1)
    throw new Error(`${label} некорректно.`);
  return value;
}
