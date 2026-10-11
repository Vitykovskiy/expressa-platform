import type { OrderFilters } from "../entities/order/order.types";

export interface OrdersPageProps {
  filters: OrderFilters;
  selectedId: string | null;
  navigationError: string;
}
export interface OrdersPageEmits {
  "reset-address": [];
  search: [filters: OrderFilters];
  select: [id: string];
  back: [];
  "search-dirty": [value: boolean];
}
