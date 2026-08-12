import type { ListOrdersQuery, OrderReadRepository } from './order-lifecycle.types';
import type { OrderDetails, OrderQueueItem } from '../domain/order-lifecycle.types';
import { OrderNotFoundError } from '../domain/order-lifecycle.errors';

export class GetOrdersUseCase {
  constructor(private readonly repository: OrderReadRepository) {}

  list(query: ListOrdersQuery): Promise<readonly OrderQueueItem[]> { return this.repository.list(query); }

  async details(orderId: string): Promise<OrderDetails> {
    const order = await this.repository.findDetails(orderId);
    if (order === null) throw new OrderNotFoundError();
    return order;
  }
}
