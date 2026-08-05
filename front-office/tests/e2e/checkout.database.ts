import { Pool } from "pg";

import { frontOfficeE2eDatabaseUrl } from "../../playwright.config.constants";
import {
  acceptsNewOrdersSettingKey,
  checkoutSeedIds,
} from "./checkout.database.constants";
import type {
  CheckoutDatabaseState,
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
      `SELECT products.is_available AS "productAvailable", variants.is_available AS "variantAvailable", options.is_available AS "modifierAvailable", variants.price_minor AS "variantPriceMinor", settings.value AS "acceptsNewOrders"
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
    if (
      !Number.isSafeInteger(row.variantPriceMinor) ||
      row.variantPriceMinor < 0
    )
      throw new Error("Цена checkout seed некорректна.");
    return row;
  }

  async restore(state: CheckoutDatabaseState): Promise<void> {
    await this.setProductAvailable(state.productAvailable);
    await this.setVariantAvailable(state.variantAvailable);
    await this.setModifierAvailable(state.modifierAvailable);
    await this.setVariantPriceMinor(state.variantPriceMinor);
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

  async setVariantPriceMinor(value: number): Promise<void> {
    if (!Number.isSafeInteger(value) || value < 0)
      throw new Error("Цена должна быть неотрицательным целым числом.");
    await this.#update(
      "product_variants",
      "price_minor",
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
              orders.total_minor AS "totalMinor",
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
      totalMinor: requireNonNegativeInteger(row.totalMinor, "Сумма заказа"),
    };
  }

  async #update(
    table:
      "products" | "product_variants" | "modifier_options" | "service_settings",
    column: "is_available" | "price_minor" | "value",
    value: boolean | number,
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
