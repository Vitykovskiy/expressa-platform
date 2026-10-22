import type { OrderNotificationPort } from "./order-notification-port.types";
import type { OrderMetricsPort } from "./order-metrics.types";
import type {
  SourceOrderCommand,
  SourceOrderUnitOfWork,
} from "./source-order-actions.types";
import type { OrderDetails } from "../domain/order-lifecycle.types";

export class SourceOrderActionsUseCase {
  constructor(
    private readonly unitOfWork: SourceOrderUnitOfWork,
    private readonly push: OrderNotificationPort,
    private readonly metrics: OrderMetricsPort,
  ) {}

  async execute(command: SourceOrderCommand): Promise<OrderDetails> {
    const order = await this.unitOfWork.applySourceAction(command);
    if (command.action === "ready") {
      this.metrics.recordOrderTransition("READY");
    }
    void this.push
      .execute({
        recipient: "customer",
        orderId: order.id,
        number: order.number,
        stage: command.action === "ready" ? "READY" : "REJECTED",
        customerId: order.customer.id,
        ...(command.action === "reject"
          ? { rejectionReason: command.reason }
          : {}),
      })
      .catch(() => undefined);
    return order;
  }
}
