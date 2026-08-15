import type { OrderTransitionUnitOfWork, TransitionOrderCommand } from './order-lifecycle.types';
import type { OrderDetails } from '../domain/order-lifecycle.types';
import { SendOrderPushUseCase } from '../../notifications/application/send-order-push.use-case';

export class TransitionOrderUseCase {
  constructor(private readonly unitOfWork: OrderTransitionUnitOfWork, private readonly push: SendOrderPushUseCase) {}
  async execute(command: TransitionOrderCommand): Promise<OrderDetails> {
    const order = await this.unitOfWork.transition(command);
    if (order.stage === 'ACCEPTED' || order.stage === 'READY' || order.stage === 'ISSUED') {
      void this.push.execute({ recipient: 'customer', orderId: order.id, number: order.number, stage: order.stage, customerId: order.customer.id }).catch(() => undefined);
    }
    return order;
  }
}
