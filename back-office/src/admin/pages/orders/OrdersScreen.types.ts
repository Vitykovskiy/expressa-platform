import type {
  Order,
  OrderAction,
  OrderActionEvent,
} from "../../shared/ui/Admin.types";

export type OrderFilter = "all" | "created" | "confirmed" | "ready";

export type OrderMutationAction = Exclude<OrderAction, "reject" | "close">;

export interface OrdersScreenProps {
  orders: readonly Order[];
}

export interface OrdersScreenEmits {
  refresh: [];
  "order-action": [event: OrderActionEvent];
}
