import { TransitionOrderUseCase } from './transition-order.use-case';
import type { SendOrderPushUseCase } from '../../notifications/application/send-order-push.use-case';

describe('TransitionOrderUseCase', () => {
  it('передаёт атомарный переход в единицу работы', async () => {
    const unitOfWork = { transition: jest.fn().mockResolvedValue({ id: 'order-id' }) };
    const push = { execute: jest.fn().mockResolvedValue(undefined) } as unknown as SendOrderPushUseCase;
    const useCase = new TransitionOrderUseCase(unitOfWork, push);
    const command = { orderId: 'order-id', action: 'accept' as const, actorId: 'actor-id', occurredAt: new Date('2030-01-02T03:04:05.000Z') };

    await expect(useCase.execute(command)).resolves.toEqual({ id: 'order-id' });
    expect(unitOfWork.transition).toHaveBeenCalledWith(command);
  });
});
