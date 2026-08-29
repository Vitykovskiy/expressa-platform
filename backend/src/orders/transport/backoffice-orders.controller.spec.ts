import { BackofficeOrdersController } from './backoffice-orders.controller';
import { OrderNotFoundError, OrderStageConflictError } from '../domain/order-lifecycle.errors';
import { GetOrdersUseCase } from '../application/get-orders.use-case';
import { TransitionOrderUseCase } from '../application/transition-order.use-case';

const orderId = '6f7ef502-6ee5-4b27-84db-a118d9c710de';
const auth = { userId: 'ccca6117-9fa5-4d9a-986d-8d02747cc6d5', sessionId: 'session-id', phoneE164: '+79991234567', role: 'barista' as const };
const details = { id: orderId, number: '20300102-001', createdAt: new Date('2030-01-02T03:04:05.000Z'), totalMinor: 450, stage: 'CREATED' as const, customer: { id: 'customer-id', phoneE164: '+79990000000' }, snapshot: [], events: [{ actorId: auth.userId, actorLabel: auth.phoneE164, occurredAt: new Date('2030-01-02T03:04:05.000Z'), from: 'CREATED' as const, to: 'ACCEPTED' as const }] };

describe('BackofficeOrdersController', () => {
  it('отдаёт staff-очередь и детали в каноническом DTO', async () => {
    const getOrders = { list: jest.fn().mockResolvedValue([details]), details: jest.fn().mockResolvedValue(details) };
    const controller = new BackofficeOrdersController(getOrders as unknown as GetOrdersUseCase, { execute: jest.fn() } as unknown as TransitionOrderUseCase, { now: () => new Date() });

    await expect(controller.list('CREATED', '001')).resolves.toEqual([{ id: orderId, number: '20300102-001', createdAt: '2030-01-02T03:04:05.000Z', totalMinor: 450, stage: 'CREATED' }]);
    await expect(controller.details(orderId)).resolves.toMatchObject({ customer: details.customer, snapshot: [], events: [{ actorId: auth.userId, actorLabel: auth.phoneE164 }] });
    expect(getOrders.list).toHaveBeenCalledWith({ stage: 'CREATED', number: '001' });
  });

  it.each([[new OrderNotFoundError(), 404, 'ORDER_NOT_FOUND'], [new OrderStageConflictError(), 409, 'ORDER_STAGE_CONFLICT']])('возвращает структуру ошибки lifecycle', async (error, status, code) => {
    const controller = new BackofficeOrdersController({ list: jest.fn(), details: jest.fn() } as unknown as GetOrdersUseCase, { execute: jest.fn().mockRejectedValue(error) } as unknown as TransitionOrderUseCase, { now: () => new Date() });

    await expect(controller.accept(orderId, auth)).rejects.toMatchObject({ status, response: { code, details: null } });
  });

  it('отклоняет недопустимые параметры до application', async () => {
    const getOrders = { list: jest.fn(), details: jest.fn() };
    const controller = new BackofficeOrdersController(getOrders as unknown as GetOrdersUseCase, { execute: jest.fn() } as unknown as TransitionOrderUseCase, { now: () => new Date() });

    await expect(controller.list('CANCELLED')).rejects.toMatchObject({ status: 400, response: { code: 'VALIDATION_ERROR' } });
    await expect(controller.details('bad-id')).rejects.toMatchObject({ status: 400, response: { code: 'VALIDATION_ERROR' } });
    expect(getOrders.list).not.toHaveBeenCalled();
  });

  it('передаёт выдачу заказа как следующий переход', async () => {
    const transitionOrder = { execute: jest.fn().mockResolvedValue({ ...details, stage: 'ISSUED' }) };
    const now = new Date('2030-01-02T03:04:05.000Z');
    const controller = new BackofficeOrdersController(
      { list: jest.fn(), details: jest.fn() } as unknown as GetOrdersUseCase,
      transitionOrder as unknown as TransitionOrderUseCase,
      { now: () => now },
    );

    await expect(controller.issue(orderId, auth)).resolves.toMatchObject({ stage: 'ISSUED' });
    expect(transitionOrder.execute).toHaveBeenCalledWith({ orderId, action: 'issue', actorId: auth.userId, occurredAt: now });
  });
});
