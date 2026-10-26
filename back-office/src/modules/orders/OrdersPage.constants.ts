import type { OperationsTabOption } from "../../shared/ui/operations/OperationsTabs.types";

export const ORDER_FILTER_OPTIONS = [
  { id: "all", label: "Все" },
  { id: "created", label: "Новые" },
  { id: "confirmed", label: "Подтверждённые" },
  { id: "ready", label: "Готовы" },
] as const satisfies readonly OperationsTabOption[];

export const ORDER_REFRESH_ICON = "/orders/refresh.svg";
export const ORDER_MOBILE_QUERY = "(max-width: 767px)";
