import type { OrderFilter } from "./OrdersScreen.types";

export const ORDER_FILTER_TABS: ReadonlyArray<{
  value: OrderFilter;
  label: string;
}> = [
  { value: "all", label: "Все" },
  { value: "created", label: "Новые" },
  { value: "confirmed", label: "Подтверждённые" },
  { value: "ready", label: "Готовы" },
];

export const ORDERS_SNACKBAR_TIMEOUT = 4000;
