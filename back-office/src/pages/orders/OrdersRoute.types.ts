import type { OrdersContext } from "../../entities/orders/orders.types";

export interface OrdersRouteProps {
  readonly context: OrdersContext;
  readonly search: string;
}

export interface OrdersRouteEmits {
  sessionExpired: [];
  navigate: [href: string];
}
