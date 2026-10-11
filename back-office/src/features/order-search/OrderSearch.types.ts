import type { OrderFilters } from "../../entities/order/order.types";

export interface OrderSearchProps {
  filters: OrderFilters;
  pending: boolean;
  refreshDisabled: boolean;
}
export interface OrderSearchEmits {
  search: [filters: OrderFilters];
  refresh: [];
  dirty: [value: boolean];
}
