import type { OrderCardModel } from "../../features/orders/presentation/OrderCard.types";

export interface OrdersQueueProps {
  readonly orders: readonly OrderCardModel[];
  readonly disabled: boolean;
  readonly pendingOrderId: string | null;
  readonly expandedOrderId: string | null;
}

export interface OrdersQueueEmits {
  confirm: [id: string];
  reject: [id: string];
  ready: [id: string];
  issue: [id: string];
  toggleDetails: [id: string];
}
