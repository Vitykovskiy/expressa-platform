import type { OrderTransitionUnitOfWork, TransitionOrderCommand } from './order-lifecycle.types';
import type { OrderDetails } from '../domain/order-lifecycle.types';

export class TransitionOrderUseCase {
  constructor(private readonly unitOfWork: OrderTransitionUnitOfWork) {}
  execute(command: TransitionOrderCommand): Promise<OrderDetails> { return this.unitOfWork.transition(command); }
}
