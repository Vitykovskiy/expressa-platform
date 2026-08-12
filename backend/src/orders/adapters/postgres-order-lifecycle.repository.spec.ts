import type { Pool, PoolClient } from 'pg';
import { PostgresOrderLifecycleRepository } from './postgres-order-lifecycle.repository';

const orderId = '6f7ef502-6ee5-4b27-84db-a118d9c710de';

describe('PostgresOrderLifecycleRepository', () => {
  it('меняет стадию и записывает единственное событие в одной транзакции', async () => {
    const query = jest.fn((sql: string) => {
      if (sql.includes('UPDATE orders')) return Promise.resolve({ rows: [{ id: orderId }] });
      if (sql.includes('FROM orders JOIN users')) return Promise.resolve({ rows: [{ id: orderId, number: '20300102-001', created_at: new Date('2030-01-02T03:04:05.000Z'), total_minor: 450, stage: 'ACCEPTED', customer_id: 'customer-id', customer_phone_e164: '+79991234567' }] });
      if (sql.includes('FROM order_items')) return Promise.resolve({ rows: [] });
      if (sql.includes('FROM order_item_modifiers')) return Promise.resolve({ rows: [] });
      if (sql.includes('FROM order_events')) return Promise.resolve({ rows: [{ actor_id: 'actor-id', occurred_at: new Date('2030-01-02T03:04:05.000Z'), from_stage: 'CREATED', to_stage: 'ACCEPTED' }] });
      return Promise.resolve({ rows: [] });
    });
    const client = { query, release: jest.fn() } as unknown as PoolClient;
    const repository = new PostgresOrderLifecycleRepository({ pool: { connect: jest.fn().mockResolvedValue(client) } as unknown as Pool });

    await expect(repository.transition({ orderId, action: 'accept', actorId: 'actor-id', occurredAt: new Date('2030-01-02T03:04:05.000Z') })).resolves.toMatchObject({ stage: 'ACCEPTED', events: [{ from: 'CREATED', to: 'ACCEPTED' }] });
    expect(query).toHaveBeenCalledWith('BEGIN');
    expect(query).toHaveBeenCalledWith(expect.stringContaining('UPDATE orders SET stage'), [orderId, 'CREATED', 'ACCEPTED']);
    expect(query).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO order_events'), [orderId, 'actor-id', expect.any(Date), 'CREATED', 'ACCEPTED']);
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
});
