import type { OrderStatus } from "@pages/front-office/orders/customer-order/order-details/order-details.types";

export interface OrderSnapshot {
  readonly id: string;
  readonly number: string;
  readonly productName: string;
  readonly size: string;
  readonly modifierName: string;
  readonly quantity: string;
  readonly total: string;
  readonly status: OrderStatus;
}
