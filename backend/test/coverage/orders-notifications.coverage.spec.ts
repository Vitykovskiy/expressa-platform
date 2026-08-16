import type { Pool, PoolClient } from 'pg';
import { PostgresOrderUnitOfWork } from '../../src/orders/adapters/postgres-order-unit-of-work';
import { IdempotencyKeyReusedError } from '../../src/orders/domain/order.errors';
import { TransitionOrderUseCase } from '../../src/orders/application/transition-order.use-case';
import { SendOrderPushUseCase } from '../../src/notifications/application/send-order-push.use-case';
import { PostgresPushSubscriptionRepository } from '../../src/notifications/adapters/postgres-push-subscription.repository';
import type { PushSender, PushSubscriptionRepository } from '../../src/notifications/application/push-notifications.types';

const customerId = '397e9d0c-4c6f-4a5f-8ab3-4c6f4a5f8ab3';
const idempotencyKey = 'e5a2f6d2-51ca-4f10-8cd8-584cd850d2c7';
const orderId = '6f7ef502-6ee5-4b27-84db-a118d9c710de';
const productId = '3a185da4-39e6-427c-ae84-8e1d7e039c96';
const itemId = '77777777-7777-4777-8777-777777777777';

describe('orders and notifications coverage', () => {
  it('создаёт immutable snapshot в одной транзакции и возвращает его повторным чтением', async () => {
    let idempotencyReads = 0;
    const query = jest.fn((sql: string) => {
      if (sql.includes('WHERE customer_id = $1 AND idempotency_key = $2')) {
        idempotencyReads += 1;
        return Promise.resolve({ rows: idempotencyReads === 1 ? [] : [{ id: orderId, number: '20300102-007', stage: 'CREATED', total_minor: 450, request_fingerprint: `{"totalMinor":450,"items":[{"productId":"${productId}","variantId":null,"modifierOptionIds":[],"quantity":1}]}` }] });
      }
      if (sql.includes('FROM service_settings')) return Promise.resolve({ rows: [{ value: true }] });
      if (sql.includes('FROM products')) return Promise.resolve({ rows: [{ id: productId, category_id: 'coffee', type: 'OTHER', name: 'Печенье', price_minor: 450, is_available: true }] });
      if (sql.includes('FROM product_variants') || sql.includes('FROM category_modifier_groups') || sql.includes('FROM modifier_options')) return Promise.resolve({ rows: [] });
      if (sql.includes('order_daily_counters')) return Promise.resolve({ rows: [{ last_number: 7 }] });
      if (sql.includes('INSERT INTO orders')) return Promise.resolve({ rows: [{ id: orderId, number: '20300102-007', stage: 'CREATED', total_minor: 450 }] });
      if (sql.includes('INSERT INTO order_items')) return Promise.resolve({ rows: [{ id: itemId }] });
      if (sql.includes('FROM order_item_modifiers')) return Promise.resolve({ rows: [] });
      if (sql.includes('FROM order_items')) return Promise.resolve({ rows: [{ id: itemId, product_id: productId, variant_id: null, product_name: 'Печенье', size: null, quantity: 1, unit_total_minor: 450, line_total_minor: 450 }] });
      return Promise.resolve({ rows: [] });
    });
    const client = { query, release: jest.fn() } as unknown as PoolClient;
    const unitOfWork = new PostgresOrderUnitOfWork({ pool: { connect: jest.fn().mockResolvedValue(client) } as unknown as Pool });

    await expect(unitOfWork.createOrder({
      customerId,
      idempotencyKey,
      request: { totalMinor: 450, items: [{ productId, variantId: null, modifierOptionIds: [], quantity: 1 }] },
      now: new Date('2030-01-02T03:04:05.000Z'),
    })).resolves.toMatchObject({
      replayed: false,
      order: { id: orderId, number: '20300102-007', totalMinor: 450, items: [{ productId, productName: 'Печенье' }] },
    });
    expect(query).toHaveBeenCalledWith('BEGIN');
    expect(query).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO order_items'), expect.arrayContaining([orderId, productId, null, 'Печенье']));
    expect(query).toHaveBeenCalledWith('COMMIT');
    expect((client.release as jest.Mock)).toHaveBeenCalledTimes(1);
  });

  it('откатывает повторный idempotency key с другой конфигурацией', async () => {
    const query = jest.fn((sql: string) => {
      if (sql.includes('WHERE customer_id = $1 AND idempotency_key = $2')) {
        return Promise.resolve({ rows: [{ id: orderId, number: '20300102-007', stage: 'CREATED', total_minor: 450, request_fingerprint: 'other-fingerprint' }] });
      }
      return Promise.resolve({ rows: [] });
    });
    const client = { query, release: jest.fn() } as unknown as PoolClient;
    const unitOfWork = new PostgresOrderUnitOfWork({ pool: { connect: jest.fn().mockResolvedValue(client) } as unknown as Pool });

    await expect(unitOfWork.createOrder({
      customerId,
      idempotencyKey,
      request: { totalMinor: 450, items: [{ productId, variantId: null, modifierOptionIds: [], quantity: 1 }] },
      now: new Date('2030-01-02T03:04:05.000Z'),
    })).rejects.toBeInstanceOf(IdempotencyKeyReusedError);
    expect(query).toHaveBeenCalledWith('ROLLBACK');
    expect((client.release as jest.Mock)).toHaveBeenCalledTimes(1);
  });

  it.each(['ACCEPTED', 'READY', 'ISSUED'] as const)('посылает customer push после перехода в %s, не отменяя переход при сбое', async (stage) => {
    const order = { id: orderId, number: '20300102-007', stage, customer: { id: customerId } };
    const unitOfWork = { transition: jest.fn().mockResolvedValue(order) };
    const push = { execute: jest.fn().mockRejectedValue(new Error('push unavailable')) } as unknown as SendOrderPushUseCase;
    const metrics = { recordOrderCreated: jest.fn(), recordOrderTransition: jest.fn() };

    await expect(new TransitionOrderUseCase(unitOfWork, push, metrics).execute({ orderId, action: 'accept', actorId: 'actor-id', occurredAt: new Date() })).resolves.toBe(order);
    expect(metrics.recordOrderTransition).toHaveBeenCalledWith(stage);
    expect(push.execute).toHaveBeenCalledWith({ recipient: 'customer', orderId, number: '20300102-007', stage, customerId });
  });

  it('доставляет customer статусы, удаляет только недействительные подписки и сохраняет другие', async () => {
    const stale = { id: 'stale', userId: customerId, endpoint: 'https://push.example/stale', p256dh: 'key', auth: 'auth' };
    const valid = { id: 'valid', userId: customerId, endpoint: 'https://push.example/valid', p256dh: 'key', auth: 'auth' };
    const repository: PushSubscriptionRepository = {
      upsert: jest.fn(), delete: jest.fn(), findForStaff: jest.fn(), findForUser: jest.fn().mockResolvedValue([stale, valid]),
    };
    const sender: PushSender = { send: jest.fn().mockRejectedValueOnce({ statusCode: 404 }).mockRejectedValueOnce(new Error('temporary failure')) };

    await expect(new SendOrderPushUseCase(repository, sender).execute({ recipient: 'customer', orderId, number: '20300102-007', stage: 'ISSUED', customerId })).resolves.toBeUndefined();
    expect(sender.send).toHaveBeenCalledWith(valid, { title: 'Заказ 20300102-007', body: 'Заказ выдан', orderId });
    expect(repository.delete).toHaveBeenCalledWith(customerId, stale.endpoint);
    expect(repository.delete).toHaveBeenCalledTimes(1);
  });

  it('читает staff и customer subscriptions, отвергая неполную PostgreSQL строку', async () => {
    const query = jest.fn().mockResolvedValue({ rows: [{ id: 'subscription-id', user_id: customerId, endpoint: 'https://push.example/subscription', p256dh: 'key', auth: 'auth' }] });
    const repository = new PostgresPushSubscriptionRepository({ pool: { query } as never });

    await expect(repository.findForUser(customerId)).resolves.toEqual([{ id: 'subscription-id', userId: customerId, endpoint: 'https://push.example/subscription', p256dh: 'key', auth: 'auth' }]);
    await expect(repository.findForStaff()).resolves.toHaveLength(1);
    expect(query).toHaveBeenCalledWith(expect.stringContaining("users.role IN ('barista', 'administrator')"), []);

    const broken = new PostgresPushSubscriptionRepository({ pool: { query: jest.fn().mockResolvedValue({ rows: [{ id: 'subscription-id', user_id: customerId, endpoint: '', p256dh: 'key', auth: 'auth' }] }) } as never });
    await expect(broken.findForUser(customerId)).rejects.toThrow('Invalid PostgreSQL push subscription field: endpoint');
  });
});
