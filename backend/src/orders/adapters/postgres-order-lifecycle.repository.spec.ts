import type { Pool, PoolClient } from 'pg';
import { PostgresOrderLifecycleRepository } from './postgres-order-lifecycle.repository';

const orderId = '6f7ef502-6ee5-4b27-84db-a118d9c710de';

describe('PostgresOrderLifecycleRepository', () => {
  it('меняет стадию и записывает единственное событие в одной транзакции', async () => {
    const query = jest.fn((sql: string) => {
      if (sql.includes('UPDATE orders')) return Promise.resolve({ rows: [{ id: orderId }] });
      if (sql.includes('FROM orders JOIN users')) return Promise.resolve({ rows: [{ id: orderId, number: '20300102-001', created_at: new Date('2030-01-02T03:04:05.000Z'), total: 450, stage: 'ACCEPTED', customer_id: 'customer-id', customer_phone_e164: '+79991234567' }] });
      if (sql.includes('FROM order_items')) return Promise.resolve({ rows: [] });
      if (sql.includes('FROM order_item_modifiers')) return Promise.resolve({ rows: [] });
      if (sql.includes('FROM order_events')) return Promise.resolve({ rows: [{ actor_id: 'actor-id', actor_label: '+79991234567', occurred_at: new Date('2030-01-02T03:04:05.000Z'), from_stage: 'CREATED', to_stage: 'ACCEPTED' }] });
      return Promise.resolve({ rows: [] });
    });
    const client = { query, release: jest.fn() } as unknown as PoolClient;
    const repository = new PostgresOrderLifecycleRepository({ pool: { connect: jest.fn().mockResolvedValue(client) } as unknown as Pool });

    await expect(repository.transition({ orderId, action: 'accept', actorId: 'actor-id', occurredAt: new Date('2030-01-02T03:04:05.000Z') })).resolves.toMatchObject({ stage: 'ACCEPTED', events: [{ actorId: 'actor-id', actorLabel: '+79991234567', from: 'CREATED', to: 'ACCEPTED' }] });
    expect(query).toHaveBeenCalledWith('BEGIN');
    expect(query).toHaveBeenCalledWith(expect.stringContaining('UPDATE orders SET stage'), [orderId, 'CREATED', 'ACCEPTED']);
    expect(query).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO order_events'), [orderId, 'actor-id', expect.any(Date), 'CREATED', 'ACCEPTED']);
    expect(query).toHaveBeenCalledWith(expect.stringContaining('INNER JOIN users u ON u.id = e.actor_id'), [orderId]);
    expect(query).toHaveBeenCalledWith('COMMIT');
  });

  it('откатывает переход, если стадия не соответствует ожидаемой', async () => {
    const query = jest.fn((sql: string) => sql.includes('UPDATE orders') ? Promise.resolve({ rows: [] }) : sql.includes('SELECT id FROM orders') ? Promise.resolve({ rows: [{ id: orderId }] }) : Promise.resolve({ rows: [] }));
    const client = { query, release: jest.fn() } as unknown as PoolClient;
    const repository = new PostgresOrderLifecycleRepository({ pool: { connect: jest.fn().mockResolvedValue(client) } as unknown as Pool });

    await expect(repository.transition({ orderId, action: 'accept', actorId: 'actor-id', occurredAt: new Date() })).rejects.toMatchObject({ code: 'ORDER_STAGE_CONFLICT' });
    expect(query).toHaveBeenCalledWith('ROLLBACK');
  });

  it('откатывает смену стадии, если не записалось событие', async () => {
    const query = jest.fn((sql: string) => {
      if (sql.includes('UPDATE orders')) return Promise.resolve({ rows: [{ id: orderId }] });
      if (sql.includes('INSERT INTO order_events')) return Promise.reject(new Error('event failure'));
      return Promise.resolve({ rows: [] });
    });
    const client = { query, release: jest.fn() } as unknown as PoolClient;
    const repository = new PostgresOrderLifecycleRepository({ pool: { connect: jest.fn().mockResolvedValue(client) } as unknown as Pool });

    await expect(repository.transition({ orderId, action: 'accept', actorId: 'actor-id', occurredAt: new Date() })).rejects.toThrow('event failure');
    expect(query).toHaveBeenCalledWith('ROLLBACK');
    expect(query).not.toHaveBeenCalledWith('COMMIT');
  });

  it('читает customer историю по снимку и следующему курсору', async () => {
    const customerId = 'ccca6117-9fa5-4d9a-986d-8d02747cc6d5';
    const createdAt = new Date('2030-01-02T03:04:05.000Z');
    const itemId = '77777777-7777-4777-8777-777777777777';
    const query = jest.fn((sql: string) => {
      if (sql.includes('FROM orders') && sql.includes('customer_id = $1')) {
        return Promise.resolve({ rows: [
          { id: orderId, number: '20300102-002', created_at: createdAt, cursor_created_at: '2030-01-02 03:04:05+00', total: 450, stage: 'ISSUED' },
        ] });
      }
      if (sql.includes('FROM order_item_modifiers')) return Promise.resolve({ rows: [{ order_item_id: itemId, modifier_option_id: '88888888-8888-4888-8888-888888888888', modifier_name: 'Овсяное молоко', price_delta: 50 }] });
      if (sql.includes('FROM order_items')) return Promise.resolve({ rows: [{ id: itemId, order_id: orderId, product_id: '99999999-9999-4999-8999-999999999999', variant_id: null, product_name: 'Капучино', size: null, quantity: 1, unit_total: 450, line_total: 450 }] });
      return Promise.resolve({ rows: [] });
    });
    const repository = new PostgresOrderLifecycleRepository({ pool: { query } as unknown as Pool });

    await expect(repository.listForCustomer(customerId, null)).resolves.toEqual({
      orders: [
        { id: orderId, number: '20300102-002', createdAt, total: 450, stage: 'ISSUED', snapshot: [{ productId: '99999999-9999-4999-8999-999999999999', variantId: null, productName: 'Капучино', size: null, quantity: 1, unitTotal: 450, lineTotal: 450, modifiers: [{ modifierOptionId: '88888888-8888-4888-8888-888888888888', modifierName: 'Овсяное молоко', priceDelta: 50 }] }] },
      ],
      nextCursor: null,
    });
    expect(query).toHaveBeenCalledWith(expect.stringContaining('ORDER BY created_at DESC, id DESC'), [customerId, null, null]);
    expect(query).toHaveBeenCalledTimes(3);
  });

  it('читает 20 customer снимков тремя bounded запросами', async () => {
    const customerId = 'ccca6117-9fa5-4d9a-986d-8d02747cc6d5';
    const ids = Array.from({ length: 20 }, (_value, index) => `00000000-0000-4000-8000-${String(index + 1).padStart(12, '0')}`);
    const query = jest.fn((sql: string) => {
      if (sql.includes('FROM orders') && sql.includes('customer_id = $1')) {
        return Promise.resolve({ rows: ids.map((id, index) => ({ id, number: `20310205-${String(index + 1).padStart(3, '0')}`, created_at: new Date(`2031-02-05T13:00:${String(index).padStart(2, '0')}.000Z`), cursor_created_at: `2031-02-05 13:00:${String(index).padStart(2, '0')}+00`, total: 100, stage: 'CREATED' })) });
      }
      if (sql.includes('FROM order_item_modifiers')) return Promise.resolve({ rows: [] });
      if (sql.includes('FROM order_items')) return Promise.resolve({ rows: ids.map((id) => ({ id: `${id.slice(0, -1)}1`, order_id: id, product_id: '99999999-9999-4999-8999-999999999999', variant_id: null, product_name: 'Американо', size: null, quantity: 1, unit_total: 100, line_total: 100 })) });
      return Promise.resolve({ rows: [] });
    });
    const repository = new PostgresOrderLifecycleRepository({ pool: { query } as unknown as Pool });

    const page = await repository.listForCustomer(customerId, null);

    expect(page.orders.map((order) => order.id)).toEqual(ids);
    expect(page.orders.every((order) => order.snapshot[0]?.productName === 'Американо')).toBe(true);
    expect(page.nextCursor).toBeNull();
    expect(query).toHaveBeenCalledTimes(3);
    expect(query).toHaveBeenCalledWith(expect.stringContaining('WHERE order_id = ANY($1::uuid[])'), [ids]);
  });

  it('сохраняет микросекунды cursor при одинаковой миллисекунде', async () => {
    const customerId = 'ccca6117-9fa5-4d9a-986d-8d02747cc6d5';
    const ids = Array.from({ length: 21 }, (_value, index) => `00000000-0000-4000-8000-${String(index + 1).padStart(12, '0')}`);
    const cursorCreatedAt = '2031-02-05 13:00:00.123456+00';
    let orderQueryCount = 0;
    const query = jest.fn((sql: string) => {
      if (sql.includes('FROM orders') && sql.includes('customer_id = $1')) {
        orderQueryCount += 1;
        return Promise.resolve({ rows: orderQueryCount === 1
          ? ids.map((id, index) => ({ id, number: `20310205-${String(index + 1).padStart(3, '0')}`, created_at: new Date('2031-02-05T13:00:00.123Z'), cursor_created_at: index === 19 ? cursorCreatedAt : '2031-02-05 13:00:00.123457+00', total: 100, stage: 'CREATED' }))
          : [{ id: ids[20], number: '20310205-021', created_at: new Date('2031-02-05T13:00:00.123Z'), cursor_created_at: '2031-02-05 13:00:00.123455+00', total: 100, stage: 'CREATED' }] });
      }
      return Promise.resolve({ rows: [] });
    });
    const repository = new PostgresOrderLifecycleRepository({ pool: { query } as unknown as Pool });

    const firstPage = await repository.listForCustomer(customerId, null);
    await expect(repository.listForCustomer(customerId, firstPage.nextCursor)).resolves.toMatchObject({ orders: [{ id: ids[20] }] });

    expect(firstPage.nextCursor).toEqual({ createdAt: cursorCreatedAt, id: ids[19] });
    expect(query).toHaveBeenCalledWith(expect.stringContaining('(created_at, id) <'), [customerId, cursorCreatedAt, ids[19]]);
  });

  it('не читает customer detail, если customer не владеет заказом', async () => {
    const query = jest.fn().mockResolvedValue({ rows: [] });
    const repository = new PostgresOrderLifecycleRepository({ pool: { query } as unknown as Pool });

    await expect(repository.findDetailsForCustomer('customer-id', orderId)).resolves.toBeNull();
    expect(query).toHaveBeenCalledWith(expect.stringContaining('WHERE id = $1 AND customer_id = $2'), [orderId, 'customer-id']);
  });
});
