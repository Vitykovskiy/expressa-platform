import type { OrderCardModel } from "../../features/orders/ui/OrderCard.types";

export type OrderFilter = "all" | "created" | "confirmed" | "ready";

export interface OrdersPageProps {
  readonly orders: readonly OrderCardModel[];
  readonly filter: OrderFilter;
  readonly phase: "loading" | "ready" | "error";
  readonly errorMessage: string | null;
  readonly commandsDisabled: boolean;
  readonly pendingOrderId: string | null;
  readonly expandedOrderId: string | null;
  readonly selectedOrder: OrderCardModel | null;
}

export interface OrdersPageEmits {
  selectFilter: [filter: OrderFilter];
  refresh: [];
  confirm: [id: string];
  reject: [id: string];
  ready: [id: string];
  issue: [id: string];
  toggleDetails: [id: string];
}

export interface OrdersPageHandle {
  captureScroll(): number;
  restoreScroll(position: number): void;
  focusHeading(): void;
}

export interface OrdersPageSlots {
  feedback?: () => unknown;
}
