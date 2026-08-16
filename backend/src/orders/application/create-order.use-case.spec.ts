import { CreateOrderUseCase } from './create-order.use-case';
import type { CreateOrderCommand, OrderUnitOfWork } from './order-unit-of-work.types';
import type { SendOrderPushUseCase } from '../../notifications/application/send-order-push.use-case';

const command: CreateOrderCommand = {
  customerId: '397e9d0c-4c6f-4a5f-8ab3-4c6f4a5f8ab3',
  idempotencyKey: 'e5a2f6d2-51ca-4f10-8cd8-584cd850d2c7',
  request: {
    totalMinor: 450,
    items: [{ productId: '3a185da4-39e6-427c-ae84-8e1d7e039c96', variantId: null, modifierOptionIds: [], quantity: 1 }],
  },
  now: new Date('2030-01-02T03:04:05.000Z'),
};

describe('CreateOrderUseCase', () => {
  it('передаёт команду единице работы без изменения', async () => {
    const result = {
      order: { id: 'order-id', number: '20300102-001', stage: 'CREATED' as const, totalMinor: 450, items: [] },
      replayed: false,
    };
    const unitOfWork: OrderUnitOfWork = { createOrder: jest.fn().mockResolvedValue(result) };
    const push = { execute: jest.fn().mockResolvedValue(undefined) } as unknown as SendOrderPushUseCase;
    const metrics = { recordOrderCreated: jest.fn(), recordOrderTransition: jest.fn() };
    const useCase = new CreateOrderUseCase(unitOfWork, push, metrics);

    await expect(useCase.execute(command)).resolves.toBe(result);
    expect(unitOfWork.createOrder).toHaveBeenCalledWith(command);
    expect(metrics.recordOrderCreated).toHaveBeenCalledTimes(1);
    expect(push.execute).toHaveBeenCalledWith({ recipient: 'staff', orderId: 'order-id', number: '20300102-001', stage: 'CREATED', customerId: command.customerId });
  });

  it('не уведомляет staff при idempotency replay', async () => {
    const result = { order: { id: 'order-id', number: '20300102-001', stage: 'CREATED' as const, totalMinor: 450, items: [] }, replayed: true };
    const unitOfWork: OrderUnitOfWork = { createOrder: jest.fn().mockResolvedValue(result) };
    const push = { execute: jest.fn().mockResolvedValue(undefined) } as unknown as SendOrderPushUseCase;
    const metrics = { recordOrderCreated: jest.fn(), recordOrderTransition: jest.fn() };

    await new CreateOrderUseCase(unitOfWork, push, metrics).execute(command);

    expect(push.execute).not.toHaveBeenCalled();
    expect(metrics.recordOrderCreated).not.toHaveBeenCalled();
  });
});
