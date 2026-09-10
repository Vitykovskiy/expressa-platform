import type { CustomerOrder } from "@/shared/api/orders.api";

export interface OrdersHistoryScreenProps {
  errorMessage: string | null;
  hasMore: boolean;
  loading: boolean;
  orders: CustomerOrder[];
  staleMessage: string | null;
}

export type OrdersHistoryScreenEmits = {
  loadMore: [];
  repeat: [orderId: string];
  retry: [];
  signOut: [];
};
