import type { OrdersView } from "./orders.types";
import type { OrderFilter } from "./OrdersPage.types";

export const ORDERS_DOCUMENT_TITLE = "Заказы · Expressa";

export const ORDER_FILTER_TO_VIEW: Readonly<Record<OrderFilter, OrdersView>> = {
  all: "all",
  created: "new",
  confirmed: "confirmed",
  ready: "ready",
};

export const ORDER_VIEW_TO_FILTER: Readonly<Record<OrdersView, OrderFilter>> = {
  all: "all",
  new: "created",
  confirmed: "confirmed",
  ready: "ready",
};
