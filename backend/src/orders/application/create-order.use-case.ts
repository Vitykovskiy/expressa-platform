import type { CreateOrderCommand, CreateOrderResult, OrderUnitOfWork } from './order-unit-of-work.types';

export class CreateOrderUseCase {
  constructor(private readonly unitOfWork: OrderUnitOfWork) {}

  execute(command: CreateOrderCommand): Promise<CreateOrderResult> {
    return this.unitOfWork.createOrder(command);
  }
}
