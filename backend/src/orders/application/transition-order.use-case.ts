import type {
  OrderTransitionUnitOfWork,
  TransitionOrderCommand,
} from "./order-lifecycle.types";
import type { OrderMetricsPort } from "./order-metrics.types";
import type { OrderDetails } from "../domain/order-lifecycle.types";
import type { OrderNotificationPort } from "./order-notification-port.types";

export class TransitionOrderUseCase {
  constructor(
    private readonly unitOfWork: OrderTransitionUnitOfWork,
    private readonly push: OrderNotificationPort,
    private readonly metrics: OrderMetricsPort,
  ) {}
  async execute(command: TransitionOrderCommand): Promise<OrderDetails> {
    const order = await this.unitOfWork.transition(command);
    this.metrics.recordOrderTransition(order.stage);
    if (
      order.stage === "ACCEPTED" ||
      order.stage === "READY" ||
      order.stage === "ISSUED"
    ) {
      void this.push
        .execute({
          recipient: "customer",
          orderId: order.id,
          number: order.number,
          stage: order.stage,
          customerId: order.customer.id,
        })
        .catch(() => undefined);
    }
    return order;
  }
}
