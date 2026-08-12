import type { OrderDetails, OrderQueueItem, OrderStage, OrderTransitionAction } from '../domain/order-lifecycle.types';

export type ListOrdersQuery = { stage?: OrderStage; number?: string };
export type TransitionOrderCommand = { orderId: string; action: OrderTransitionAction; actorId: string; occurredAt: Date };

export interface OrderReadRepository {
  list(query: ListOrdersQuery): Promise<readonly OrderQueueItem[]>;
  findDetails(orderId: string): Promise<OrderDetails | null>;
}

export interface OrderTransitionUnitOfWork {
  transition(command: TransitionOrderCommand): Promise<OrderDetails>;
}
