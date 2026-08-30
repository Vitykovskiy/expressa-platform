import type {
  OrderDetails,
  OrderQueueItem,
  OrderStage,
  OrderTransitionAction,
} from "../domain/order-lifecycle.types";
import type { OrderSnapshotItem } from "../domain/order.types";

export type ListOrdersQuery = { stage?: OrderStage; number?: string };
export type TransitionOrderCommand = {
  orderId: string;
  action: OrderTransitionAction;
  actorId: string;
  occurredAt: Date;
};
export type CustomerOrdersCursor = { createdAt: string; id: string };
export type CustomerOrder = OrderQueueItem & {
  snapshot: readonly OrderSnapshotItem[];
};
export type CustomerOrdersPage = {
  orders: readonly CustomerOrder[];
  nextCursor: CustomerOrdersCursor | null;
};

export interface OrderReadRepository {
  list(query: ListOrdersQuery): Promise<readonly OrderQueueItem[]>;
  findDetails(orderId: string): Promise<OrderDetails | null>;
  listForCustomer(
    customerId: string,
    cursor: CustomerOrdersCursor | null,
  ): Promise<CustomerOrdersPage>;
  findDetailsForCustomer(
    customerId: string,
    orderId: string,
  ): Promise<CustomerOrder | null>;
}

export interface OrderTransitionUnitOfWork {
  transition(command: TransitionOrderCommand): Promise<OrderDetails>;
}
