import {
  catalogAdvisoryLockKey,
  publicMenuAdvisoryLockSql,
} from '../../catalog/adapters/catalog-advisory-lock.constants';
import { acceptsNewOrdersSettingKey } from '../../catalog/domain/catalog.constants';
import { createOrderFingerprint } from '../domain/order-fingerprint';
import { revalidateOrder } from '../domain/order-revalidation';
import { IdempotencyKeyReusedError } from '../domain/order.errors';
import type {
  OrderCatalog,
  OrderCatalogModifierGroup,
  OrderCatalogModifierOption,
  OrderCatalogProduct,
  OrderCatalogVariant,
  OrderRevalidationResult,
  OrderSnapshotItem,
  OrderSnapshotModifier,
} from '../domain/order.types';
import type {
  CreateOrderCommand,
  CreateOrderResult,
  OrderUnitOfWork,
  StoredOrder,
} from '../application/order-unit-of-work.types';
import type {
  DatabaseRow,
  PostgresOrderUnitOfWorkDependencies,
  TransactionClient,
} from './postgres-order-unit-of-work.types';
import { idempotencyLockSql } from './postgres-order-unit-of-work.constants';

export class PostgresOrderUnitOfWork implements OrderUnitOfWork {
  constructor(private readonly dependencies: PostgresOrderUnitOfWorkDependencies) {}

  async createOrder(command: CreateOrderCommand): Promise<CreateOrderResult> {
    const client = await this.dependencies.pool.connect();

    try {
      await client.query('BEGIN');
      await client.query(idempotencyLockSql, [command.customerId + ':' + command.idempotencyKey]);

      const fingerprint = createOrderFingerprint(command.request);
      const existingOrder = await findOrderByIdempotencyKey(client, command.customerId, command.idempotencyKey);
      if (existingOrder !== null) {
        if (existingOrder.fingerprint !== fingerprint) {
          throw new IdempotencyKeyReusedError();
        }

        await client.query('COMMIT');
        return { order: existingOrder.order, replayed: true };
      }

      await client.query(publicMenuAdvisoryLockSql, [catalogAdvisoryLockKey]);
      const catalog = await readCurrentCatalog(client, command.request.items.map((item) => item.productId));
      const snapshot = revalidateOrder(command.request, catalog);
      const insertedOrder = await insertOrder(client, command, fingerprint, snapshot);
      const persistedOrder = await findOrderByIdempotencyKey(client, command.customerId, command.idempotencyKey);
      if (persistedOrder === null || persistedOrder.order.id !== insertedOrder.id) {
        throw new Error('PostgreSQL did not persist created order');
      }

      await client.query('COMMIT');
      return { order: persistedOrder.order, replayed: false };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}

async function findOrderByIdempotencyKey(
  client: TransactionClient,
  customerId: string,
  idempotencyKey: string,
): Promise<{ fingerprint: string; order: StoredOrder } | null> {
  const result = await client.query<DatabaseRow>(
    `SELECT id, number, stage, total, request_fingerprint
     FROM orders
     WHERE customer_id = $1 AND idempotency_key = $2`,
    [customerId, idempotencyKey],
  );
  const row = result.rows[0];
  if (row === undefined) {
    return null;
  }
  if (result.rows.length !== 1) {
    throw new Error('Invalid PostgreSQL idempotency result');
  }

  const id = readString(row, 'id');
  const fingerprint = readString(row, 'request_fingerprint');
  const items = await readSnapshotItems(client, id);
  return {
    fingerprint,
    order: {
      id,
      number: readString(row, 'number'),
      stage: readOrderStage(row),
      total: readNonNegativeInteger(row, 'total'),
      items,
    },
  };
}

async function readSnapshotItems(client: TransactionClient, orderId: string): Promise<readonly OrderSnapshotItem[]> {
  const items = await client.query<DatabaseRow>(
    `SELECT id, product_id, variant_id, product_name, size, quantity, unit_total, line_total
     FROM order_items
     WHERE order_id = $1
     ORDER BY sort_order`,
    [orderId],
  );
  const modifiers = await client.query<DatabaseRow>(
    `SELECT order_item_id, modifier_option_id, modifier_name, price_delta
     FROM order_item_modifiers
     WHERE order_item_id IN (SELECT id FROM order_items WHERE order_id = $1)
     ORDER BY order_item_id, sort_order`,
    [orderId],
  );
  const modifiersByItemId = new Map<string, OrderSnapshotModifier[]>();
  for (const row of modifiers.rows) {
    const itemId = readString(row, 'order_item_id');
    const itemModifiers = modifiersByItemId.get(itemId) ?? [];
    itemModifiers.push({
      modifierOptionId: readString(row, 'modifier_option_id'),
      modifierName: readString(row, 'modifier_name'),
      priceDelta: readInteger(row, 'price_delta'),
    });
    modifiersByItemId.set(itemId, itemModifiers);
  }

  return items.rows.map((row) => {
    const itemId = readString(row, 'id');
    return {
      productId: readString(row, 'product_id'),
      variantId: readNullableString(row, 'variant_id'),
      productName: readString(row, 'product_name'),
      size: readNullableProductSize(row, 'size'),
      quantity: readPositiveInteger(row, 'quantity'),
      unitTotal: readNonNegativeInteger(row, 'unit_total'),
      lineTotal: readNonNegativeInteger(row, 'line_total'),
      modifiers: modifiersByItemId.get(itemId) ?? [],
    };
  });
}

async function readCurrentCatalog(client: TransactionClient, productIds: readonly string[]): Promise<OrderCatalog> {
  const [setting, products, variants, groups, options] = await Promise.all([
    client.query<DatabaseRow>(`SELECT value FROM service_settings WHERE key = $1`, [acceptsNewOrdersSettingKey]),
    client.query<DatabaseRow>(
      `SELECT products.id, products.category_id, products.type, products.name, products.price, products.is_available
       FROM products
       JOIN categories ON categories.id = products.category_id
       WHERE products.archived_at IS NULL AND products.is_active
         AND categories.archived_at IS NULL AND categories.is_active
         AND products.id = ANY($1)`,
      [productIds],
    ),
    client.query<DatabaseRow>(
      `SELECT variants.id, variants.product_id, variants.size, variants.price, variants.is_available
       FROM product_variants variants
       JOIN products ON products.id = variants.product_id
       JOIN categories ON categories.id = products.category_id
       WHERE variants.archived_at IS NULL AND products.archived_at IS NULL AND products.is_active
         AND categories.archived_at IS NULL AND categories.is_active
         AND products.id = ANY($1)`,
      [productIds],
    ),
    client.query<DatabaseRow>(
      `SELECT DISTINCT assignments.category_id, groups.id, groups.selection_type, groups.min_select, groups.max_select
       FROM category_modifier_groups assignments
       JOIN modifier_groups groups ON groups.id = assignments.group_id
       JOIN categories ON categories.id = assignments.category_id
       JOIN products ON products.category_id = categories.id
       WHERE groups.archived_at IS NULL AND groups.is_active
         AND categories.archived_at IS NULL AND categories.is_active
         AND products.archived_at IS NULL AND products.is_active
         AND products.id = ANY($1)`,
      [productIds],
    ),
    client.query<DatabaseRow>(
      `SELECT options.group_id, options.id, options.name, options.price_delta, options.is_default, options.is_available
       FROM modifier_options options
       JOIN modifier_groups groups ON groups.id = options.group_id
       WHERE options.archived_at IS NULL AND groups.archived_at IS NULL AND groups.is_active`,
    ),
  ]);

  return {
    acceptsNewOrders: readAcceptsNewOrders(setting.rows),
    products: buildCatalogProducts(products.rows, variants.rows, groups.rows, options.rows),
  };
}

function buildCatalogProducts(
  productRows: DatabaseRow[],
  variantRows: DatabaseRow[],
  groupRows: DatabaseRow[],
  optionRows: DatabaseRow[],
): readonly OrderCatalogProduct[] {
  const variantsByProductId = new Map<string, OrderCatalogVariant[]>();
  for (const row of variantRows) {
    const productId = readString(row, 'product_id');
    const variants = variantsByProductId.get(productId) ?? [];
    variants.push({
      id: readString(row, 'id'),
      size: readProductSize(row, 'size'),
      price: readNonNegativeInteger(row, 'price'),
      isAvailable: readBoolean(row, 'is_available'),
    });
    variantsByProductId.set(productId, variants);
  }

  const optionsByGroupId = new Map<string, OrderCatalogModifierOption[]>();
  for (const row of optionRows) {
    const groupId = readString(row, 'group_id');
    const options = optionsByGroupId.get(groupId) ?? [];
    options.push({
      id: readString(row, 'id'),
      name: readString(row, 'name'),
      priceDelta: readInteger(row, 'price_delta'),
      isDefault: readBoolean(row, 'is_default'),
      isAvailable: readBoolean(row, 'is_available'),
    });
    optionsByGroupId.set(groupId, options);
  }

  const groupsByCategoryId = new Map<string, OrderCatalogModifierGroup[]>();
  for (const row of groupRows) {
    const categoryId = readString(row, 'category_id');
    const groupId = readString(row, 'id');
    const groups = groupsByCategoryId.get(categoryId) ?? [];
    groups.push({
      id: groupId,
      selectionType: readSelectionType(row),
      minSelect: readNonNegativeInteger(row, 'min_select'),
      maxSelect: readNonNegativeInteger(row, 'max_select'),
      options: optionsByGroupId.get(groupId) ?? [],
    });
    groupsByCategoryId.set(categoryId, groups);
  }

  return productRows.map((row) => ({
    id: readString(row, 'id'),
    type: readProductType(row),
    name: readString(row, 'name'),
    price: readNullableInteger(row, 'price'),
    isAvailable: readBoolean(row, 'is_available'),
    variants: variantsByProductId.get(readString(row, 'id')) ?? [],
    modifierGroups: groupsByCategoryId.get(readString(row, 'category_id')) ?? [],
  }));
}

async function insertOrder(
  client: TransactionClient,
  command: CreateOrderCommand,
  fingerprint: string,
  snapshot: OrderRevalidationResult,
): Promise<StoredOrder> {
  const orderDay = toUtcOrderDay(command.now);
  const dailyNumber = await allocateDailyNumber(client, orderDay);
  const number = orderDay.replaceAll('-', '') + '-' + dailyNumber.toString().padStart(3, '0');
  const insertedOrder = await client.query<DatabaseRow>(
    `INSERT INTO orders (
       number, customer_id, idempotency_key, request_fingerprint, total, order_day, daily_number
     ) VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING id, number, stage, total`,
    [number, command.customerId, command.idempotencyKey, fingerprint, snapshot.total, orderDay, dailyNumber],
  );
  const row = requireSingleRow(insertedOrder.rows, 'order insert');
  const orderId = readString(row, 'id');

  for (const [itemSortOrder, item] of snapshot.items.entries()) {
    const insertedItem = await client.query<DatabaseRow>(
      `INSERT INTO order_items (
         order_id, product_id, variant_id, product_name, size, quantity, unit_total, line_total, sort_order
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING id`,
      [
        orderId,
        item.productId,
        item.variantId,
        item.productName,
        item.size,
        item.quantity,
        item.unitTotal,
        item.lineTotal,
        itemSortOrder,
      ],
    );
    const itemId = readString(requireSingleRow(insertedItem.rows, 'order item insert'), 'id');
    for (const [modifierSortOrder, modifier] of item.modifiers.entries()) {
      await client.query(
        `INSERT INTO order_item_modifiers (
           order_item_id, modifier_option_id, modifier_name, price_delta, sort_order
         ) VALUES ($1, $2, $3, $4, $5)`,
        [itemId, modifier.modifierOptionId, modifier.modifierName, modifier.priceDelta, modifierSortOrder],
      );
    }
  }

  return {
    id: orderId,
    number: readString(row, 'number'),
    stage: readOrderStage(row),
    total: readNonNegativeInteger(row, 'total'),
    items: snapshot.items,
  };
}

async function allocateDailyNumber(client: TransactionClient, orderDay: string): Promise<number> {
  const result = await client.query<DatabaseRow>(
    `INSERT INTO order_daily_counters (order_day, last_number)
     VALUES ($1, 1)
     ON CONFLICT (order_day) DO UPDATE
       SET last_number = order_daily_counters.last_number + 1
       WHERE order_daily_counters.last_number < 999
     RETURNING last_number`,
    [orderDay],
  );
  return readPositiveInteger(requireSingleRow(result.rows, 'daily order number'), 'last_number');
}

function toUtcOrderDay(now: Date): string {
  if (Number.isNaN(now.getTime())) {
    throw new Error('Order creation time is invalid');
  }
  return now.toISOString().slice(0, 10);
}

function readAcceptsNewOrders(rows: DatabaseRow[]): boolean {
  return readBoolean(requireSingleRow(rows, 'accepts_new_orders setting'), 'value');
}

function readOrderStage(row: DatabaseRow): 'CREATED' {
  const stage = readString(row, 'stage');
  if (stage !== 'CREATED') {
    throw new Error('Invalid PostgreSQL row field: stage');
  }
  return stage;
}

function readProductType(row: DatabaseRow): 'DRINK' | 'OTHER' {
  const type = readString(row, 'type');
  if (type !== 'DRINK' && type !== 'OTHER') {
    throw new Error('Invalid PostgreSQL row field: type');
  }
  return type;
}

function readProductSize(row: DatabaseRow, key: string): 'S' | 'M' | 'L' {
  const size = readString(row, key);
  if (size !== 'S' && size !== 'M' && size !== 'L') {
    throw new Error('Invalid PostgreSQL row field: ' + key);
  }
  return size;
}

function readNullableProductSize(row: DatabaseRow, key: string): 'S' | 'M' | 'L' | null {
  const value = row[key];
  return value === null ? null : readProductSize(row, key);
}

function readSelectionType(row: DatabaseRow): 'single' | 'multiple' {
  const selectionType = readString(row, 'selection_type');
  if (selectionType !== 'single' && selectionType !== 'multiple') {
    throw new Error('Invalid PostgreSQL row field: selection_type');
  }
  return selectionType;
}

function readString(row: DatabaseRow, key: string): string {
  const value = row[key];
  if (typeof value !== 'string') {
    throw new Error('Invalid PostgreSQL row field: ' + key);
  }
  return value;
}

function readNullableString(row: DatabaseRow, key: string): string | null {
  return row[key] === null ? null : readString(row, key);
}

function readBoolean(row: DatabaseRow, key: string): boolean {
  const value = row[key];
  if (typeof value !== 'boolean') {
    throw new Error('Invalid PostgreSQL row field: ' + key);
  }
  return value;
}

function readInteger(row: DatabaseRow, key: string): number {
  const value = row[key];
  if (typeof value !== 'number' || !Number.isSafeInteger(value)) {
    throw new Error('Invalid PostgreSQL row field: ' + key);
  }
  return value;
}

function readPositiveInteger(row: DatabaseRow, key: string): number {
  const value = readInteger(row, key);
  if (value < 1) {
    throw new Error('Invalid PostgreSQL row field: ' + key);
  }
  return value;
}

function readNonNegativeInteger(row: DatabaseRow, key: string): number {
  const value = readInteger(row, key);
  if (value < 0) {
    throw new Error('Invalid PostgreSQL row field: ' + key);
  }
  return value;
}

function readNullableInteger(row: DatabaseRow, key: string): number | null {
  return row[key] === null ? null : readInteger(row, key);
}

function requireSingleRow(rows: DatabaseRow[], context: string): DatabaseRow {
  if (rows.length !== 1 || rows[0] === undefined) {
    throw new Error('PostgreSQL returned invalid ' + context + ' row count');
  }
  return rows[0];
}
