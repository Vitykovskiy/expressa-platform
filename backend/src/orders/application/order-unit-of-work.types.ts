import type { OrderRequest, OrderSnapshotItem } from "../domain/order.types";

export type CreateOrderCommand = {
  customerId: string;
  idempotencyKey: string;
  request: OrderRequest;
  now: Date;
};

import type { OrderMetadata } from "../domain/order-metadata.types";
import type { OrderStage } from "../domain/order-lifecycle.types";

export type StoredOrder = OrderMetadata & {
  id: string;
  number: string;
  stage: OrderStage;
  total: number;
  items: readonly OrderSnapshotItem[];
};

export type CreateOrderResult = {
  order: StoredOrder;
  replayed: boolean;
};

export interface OrderUnitOfWork {
  createOrder(command: CreateOrderCommand): Promise<CreateOrderResult>;
}
