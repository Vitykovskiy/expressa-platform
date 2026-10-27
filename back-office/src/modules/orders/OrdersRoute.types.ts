import type { LocationQuery } from "vue-router";
import type { OrdersContext } from "./orders.types";

export interface OrdersRouteProps {
  readonly context: OrdersContext;
  readonly query: LocationQuery;
}

export interface OrdersRouteEmits {
  sessionExpired: [];
}
