import type { Order, OrderStatus } from "../../shared/model/customer.types";

export interface OrdersHistoryScreenProps {
  orders: Order[];
  statusLabels: Record<OrderStatus, string>;
  refreshing?: boolean;
  expandedOrderIds?: string[];
}

export type OrdersHistoryScreenEmits = {
  refresh: [];
  toggleOrder: [orderId: string, expanded: boolean];
};
