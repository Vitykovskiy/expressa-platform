import { GetOrdersUseCase } from './get-orders.use-case';
import { OrderNotFoundError } from '../domain/order-lifecycle.errors';
import type { OrderReadRepository } from './order-lifecycle.types';

describe('GetOrdersUseCase', () => {
  it('передаёт фильтр очереди в репозиторий', async () => {
    const expected = [{ id: 'order-id', stage: 'ISSUED' as const }];
    const repository: OrderReadRepository = { list: jest.fn().mockResolvedValue(expected), findDetails: jest.fn() };
    const useCase = new GetOrdersUseCase(repository);

    await expect(useCase.list({ stage: 'ISSUED', number: '001' })).resolves.toBe(expected);
    expect(repository.list).toHaveBeenCalledWith({ stage: 'ISSUED', number: '001' });
  });

  it('сигнализирует отсутствие деталей заказа', async () => {
    const repository: OrderReadRepository = { list: jest.fn(), findDetails: jest.fn().mockResolvedValue(null) };
    const useCase = new GetOrdersUseCase(repository);

    await expect(useCase.details('order-id')).rejects.toBeInstanceOf(OrderNotFoundError);
  });
});
