import type {
  CreateOrderCommand,
  CreateOrderResult,
  OrderUnitOfWork,
} from "./order-unit-of-work.types";
import type { OrderMetricsPort } from "./order-metrics.types";
import type { OrderNotificationPort } from "./order-notification-port.types";

export class CreateOrderUseCase {
  constructor(
    private readonly unitOfWork: OrderUnitOfWork,
    private readonly push: OrderNotificationPort,
    private readonly metrics: OrderMetricsPort,
  ) {}

  async execute(command: CreateOrderCommand): Promise<CreateOrderResult> {
    const result = await this.unitOfWork.createOrder(command);
    if (!result.replayed) {
      this.metrics.recordOrderCreated();
    }
    if (!result.replayed) {
      void this.push
        .execute({
          recipient: "staff",
          orderId: result.order.id,
          number: result.order.number,
          stage: "CREATED",
          customerId: command.customerId,
        })
        .catch(() => undefined);
    }
    return result;
  }
}
