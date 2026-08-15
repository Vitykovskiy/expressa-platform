import type { CreateOrderCommand, CreateOrderResult, OrderUnitOfWork } from './order-unit-of-work.types';
import { SendOrderPushUseCase } from '../../notifications/application/send-order-push.use-case';

export class CreateOrderUseCase {
  constructor(private readonly unitOfWork: OrderUnitOfWork, private readonly push: SendOrderPushUseCase) {}

  async execute(command: CreateOrderCommand): Promise<CreateOrderResult> {
    const result = await this.unitOfWork.createOrder(command);
    if (!result.replayed) {
      void this.push.execute({ recipient: 'staff', orderId: result.order.id, number: result.order.number, stage: 'CREATED', customerId: command.customerId }).catch(() => undefined);
    }
    return result;
  }
}
