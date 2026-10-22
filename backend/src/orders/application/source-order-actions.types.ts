import type { OrderDetails } from "../domain/order-lifecycle.types";
export type SourceOrderCommand = {
  orderId: string;
  actorId: string;
  occurredAt: Date;
  requestId: string;
} & ({ action: "ready" } | { action: "reject"; reason: string });
export interface SourceOrderUnitOfWork {
  applySourceAction(command: SourceOrderCommand): Promise<OrderDetails>;
}
