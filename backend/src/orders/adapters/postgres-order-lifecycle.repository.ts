import type { CustomerOrder, CustomerOrdersCursor, CustomerOrdersPage, OrderReadRepository, OrderTransitionUnitOfWork, ListOrdersQuery, TransitionOrderCommand } from '../application/order-lifecycle.types';
import { OrderNotFoundError, OrderStageConflictError } from '../domain/order-lifecycle.errors';
import { orderTransitions } from '../domain/order-lifecycle.constants';
import type { OrderDetails, OrderEvent, OrderQueueItem, OrderStage } from '../domain/order-lifecycle.types';
import type { OrderSnapshotItem, OrderSnapshotModifier } from '../domain/order.types';
import type { DatabaseRow, PostgresOrderLifecycleDependencies, TransactionClient } from './postgres-order-lifecycle.types';

export class PostgresOrderLifecycleRepository implements OrderReadRepository, OrderTransitionUnitOfWork {
  constructor(private readonly dependencies: PostgresOrderLifecycleDependencies) {}

  async list(query: ListOrdersQuery): Promise<readonly OrderQueueItem[]> {
    const result = await this.dependencies.pool.query<DatabaseRow>(
      `SELECT id, number, created_at, total_minor, stage FROM orders
       WHERE ($1::order_stage IS NULL OR stage = $1)
         AND ($2::text IS NULL OR number ILIKE '%' || $2 || '%')
       ORDER BY created_at ASC, id ASC`, [query.stage ?? null, query.number ?? null],
    );
    return result.rows.map(toQueueItem);
  }

  async findDetails(orderId: string): Promise<OrderDetails | null> {
    return readDetails(this.dependencies.pool, orderId);
  }

  async listForCustomer(customerId: string, cursor: CustomerOrdersCursor | null): Promise<CustomerOrdersPage> {
    const result = await this.dependencies.pool.query<DatabaseRow>(
      `SELECT id, number, created_at, created_at::text AS cursor_created_at, total_minor, stage FROM orders
       WHERE customer_id = $1
         AND ($2::timestamptz IS NULL OR (created_at, id) < ($2, $3::uuid))
       ORDER BY created_at DESC, id DESC
       LIMIT 21`,
      [customerId, cursor?.createdAt ?? null, cursor?.id ?? null],
    );
    const rows = result.rows.slice(0, 20);
    const orders = await readCustomerOrders(this.dependencies.pool, rows);
    const last = rows.at(-1);
    return {
      orders,
      nextCursor: result.rows.length > rows.length && last !== undefined
        ? { createdAt: readString(last, 'cursor_created_at'), id: readString(last, 'id') }
        : null,
    };
  }

  async findDetailsForCustomer(customerId: string, orderId: string): Promise<CustomerOrder | null> {
    const result = await this.dependencies.pool.query<DatabaseRow>(
      `SELECT id, number, created_at, total_minor, stage FROM orders WHERE id = $1 AND customer_id = $2`,
      [orderId, customerId],
    );
    const row = result.rows[0];
    if (row === undefined) return null;
    if (result.rows.length !== 1) throw new Error('Invalid PostgreSQL customer order details row count');
    return readCustomerOrder(this.dependencies.pool, row);
  }

  async transition(command: TransitionOrderCommand): Promise<OrderDetails> {
    const client = await this.dependencies.pool.connect();
    const transition = orderTransitions[command.action];
    try {
      await client.query('BEGIN');
      const updated = await client.query<DatabaseRow>(
        `UPDATE orders SET stage = $3 WHERE id = $1 AND stage = $2 RETURNING id`,
        [command.orderId, transition.from, transition.to],
      );
      if (updated.rows.length === 0) {
        const exists = await client.query<DatabaseRow>('SELECT id FROM orders WHERE id = $1', [command.orderId]);
        throw exists.rows.length === 0 ? new OrderNotFoundError() : new OrderStageConflictError();
      }
      await client.query(
        `INSERT INTO order_events (order_id, actor_id, occurred_at, from_stage, to_stage)
         VALUES ($1, $2, $3, $4, $5)`,
        [command.orderId, command.actorId, command.occurredAt, transition.from, transition.to],
      );
      const details = await readDetails(client, command.orderId);
      if (details === null) throw new Error('PostgreSQL did not persist transitioned order');
      await client.query('COMMIT');
      return details;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally { client.release(); }
  }
}

type Queryable = Pick<TransactionClient, 'query'>;

async function readDetails(client: Queryable, orderId: string): Promise<OrderDetails | null> {
  const order = await client.query<DatabaseRow>(
    `SELECT orders.id, orders.number, orders.created_at, orders.total_minor, orders.stage,
            users.id AS customer_id, users.phone_e164 AS customer_phone_e164
     FROM orders JOIN users ON users.id = orders.customer_id WHERE orders.id = $1`, [orderId],
  );
  const row = order.rows[0];
  if (row === undefined) return null;
  if (order.rows.length !== 1) throw new Error('Invalid PostgreSQL order details row count');
  const [snapshot, events] = await Promise.all([readSnapshot(client, orderId), readEvents(client, orderId)]);
  return { ...toQueueItem(row), customer: { id: readString(row, 'customer_id'), phoneE164: readString(row, 'customer_phone_e164') }, snapshot, events };
}

async function readCustomerOrder(client: Queryable, row: DatabaseRow): Promise<CustomerOrder> {
  const id = readString(row, 'id');
  return { ...toQueueItem(row), snapshot: await readSnapshot(client, id) };
}

/** Customer history keeps page order while loading every immutable snapshot in two bounded queries. */
async function readCustomerOrders(client: Queryable, rows: readonly DatabaseRow[]): Promise<readonly CustomerOrder[]> {
  if (rows.length === 0) return [];

  const orderIds = rows.map((row) => readString(row, 'id'));
  const [items, modifiers] = await Promise.all([
    client.query<DatabaseRow>(
      `SELECT id, order_id, product_id, variant_id, product_name, size, quantity, unit_total_minor, line_total_minor
       FROM order_items WHERE order_id = ANY($1::uuid[]) ORDER BY order_id, sort_order`,
      [orderIds],
    ),
    client.query<DatabaseRow>(
      `SELECT order_item_id, modifier_option_id, modifier_name, price_delta_minor FROM order_item_modifiers
       WHERE order_item_id IN (SELECT id FROM order_items WHERE order_id = ANY($1::uuid[]))
       ORDER BY order_item_id, sort_order`,
      [orderIds],
    ),
  ]);
  const snapshots = snapshotsByOrder(items.rows, modifiers.rows);
  return rows.map((row) => {
    const id = readString(row, 'id');
    return { ...toQueueItem(row), snapshot: snapshots.get(id) ?? [] };
  });
}

async function readSnapshot(client: Queryable, orderId: string): Promise<readonly OrderSnapshotItem[]> {
  const [items, modifiers] = await Promise.all([
    client.query<DatabaseRow>(`SELECT id, product_id, variant_id, product_name, size, quantity, unit_total_minor, line_total_minor FROM order_items WHERE order_id = $1 ORDER BY sort_order`, [orderId]),
    client.query<DatabaseRow>(`SELECT order_item_id, modifier_option_id, modifier_name, price_delta_minor FROM order_item_modifiers WHERE order_item_id IN (SELECT id FROM order_items WHERE order_id = $1) ORDER BY order_item_id, sort_order`, [orderId]),
  ]);
  return snapshotItems(items.rows, modifiers.rows);
}

function snapshotsByOrder(items: readonly DatabaseRow[], modifiers: readonly DatabaseRow[]): ReadonlyMap<string, readonly OrderSnapshotItem[]> {
  const byOrder = new Map<string, DatabaseRow[]>();
  for (const item of items) {
    const orderId = readString(item, 'order_id');
    const values = byOrder.get(orderId) ?? [];
    values.push(item);
    byOrder.set(orderId, values);
  }
  return new Map([...byOrder].map(([orderId, orderItems]) => [orderId, snapshotItems(orderItems, modifiers)]));
}

function snapshotItems(items: readonly DatabaseRow[], modifiers: readonly DatabaseRow[]): readonly OrderSnapshotItem[] {
  const byItem = new Map<string, OrderSnapshotModifier[]>();
  for (const row of modifiers) {
    const id = readString(row, 'order_item_id');
    const values = byItem.get(id) ?? [];
    values.push({ modifierOptionId: readString(row, 'modifier_option_id'), modifierName: readString(row, 'modifier_name'), priceDeltaMinor: readInteger(row, 'price_delta_minor') });
    byItem.set(id, values);
  }
  return items.map((row) => ({ productId: readString(row, 'product_id'), variantId: readNullableString(row, 'variant_id'), productName: readString(row, 'product_name'), size: readNullableSize(row, 'size'), quantity: readPositiveInteger(row, 'quantity'), unitTotalMinor: readNonNegativeInteger(row, 'unit_total_minor'), lineTotalMinor: readNonNegativeInteger(row, 'line_total_minor'), modifiers: byItem.get(readString(row, 'id')) ?? [] }));
}

async function readEvents(client: Queryable, orderId: string): Promise<readonly OrderEvent[]> {
  const result = await client.query<DatabaseRow>(`SELECT e.actor_id, u.phone_e164 AS actor_label, e.occurred_at, e.from_stage, e.to_stage
    FROM order_events e
    INNER JOIN users u ON u.id = e.actor_id
    WHERE e.order_id = $1
    ORDER BY e.occurred_at ASC, e.id ASC`, [orderId]);
  return result.rows.map((row) => ({ actorId: readString(row, 'actor_id'), actorLabel: readString(row, 'actor_label'), occurredAt: readDate(row, 'occurred_at'), from: readStage(row, 'from_stage'), to: readStage(row, 'to_stage') }));
}

function toQueueItem(row: DatabaseRow): OrderQueueItem { return { id: readString(row, 'id'), number: readString(row, 'number'), createdAt: readDate(row, 'created_at'), totalMinor: readNonNegativeInteger(row, 'total_minor'), stage: readStage(row, 'stage') }; }
function readString(row: DatabaseRow, key: string): string { const value = row[key]; if (typeof value !== 'string') throw new Error('Invalid PostgreSQL row field: ' + key); return value; }
function readNullableString(row: DatabaseRow, key: string): string | null { return row[key] === null ? null : readString(row, key); }
function readDate(row: DatabaseRow, key: string): Date { const value = row[key]; if (!(value instanceof Date) || Number.isNaN(value.getTime())) throw new Error('Invalid PostgreSQL row field: ' + key); return value; }
function readInteger(row: DatabaseRow, key: string): number { const value = row[key]; if (typeof value !== 'number' || !Number.isSafeInteger(value)) throw new Error('Invalid PostgreSQL row field: ' + key); return value; }
function readPositiveInteger(row: DatabaseRow, key: string): number { const value = readInteger(row, key); if (value < 1) throw new Error('Invalid PostgreSQL row field: ' + key); return value; }
function readNonNegativeInteger(row: DatabaseRow, key: string): number { const value = readInteger(row, key); if (value < 0) throw new Error('Invalid PostgreSQL row field: ' + key); return value; }
function readNullableSize(row: DatabaseRow, key: string): 'S' | 'M' | 'L' | null { const value = row[key]; if (value === null) return null; if (value === 'S' || value === 'M' || value === 'L') return value; throw new Error('Invalid PostgreSQL row field: ' + key); }
function readStage(row: DatabaseRow, key: string): OrderStage { const value = readString(row, key); if (value === 'CREATED' || value === 'ACCEPTED' || value === 'PREPARING' || value === 'READY' || value === 'ISSUED') return value; throw new Error('Invalid PostgreSQL row field: ' + key); }
