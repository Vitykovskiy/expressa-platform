import type {
  Order,
  OrderAction,
  OrderActionEvent,
} from "../../../shared/ui/admin/Admin.types";

export type OrderFilter = "all" | "created" | "confirmed" | "ready";

export type OrderMutationAction = Exclude<OrderAction, "reject" | "close">;

export type OrdersSnackbarTone = "success" | "error";

export interface OrdersScreenProps {
  orders: readonly Order[];
}

export interface OrdersScreenEmits {
  refresh: [];
  "order-action": [event: OrderActionEvent];
}
