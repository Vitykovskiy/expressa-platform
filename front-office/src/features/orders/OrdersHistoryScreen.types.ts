import type { CustomerOrder } from "@/shared/api/orders.api";

export interface OrdersHistoryScreenProps {
  errorMessage: string | null;
  hasMore: boolean;
  loading: boolean;
  orders: CustomerOrder[];
}

export type OrdersHistoryScreenEmits = {
  loadMore: [];
  retry: [];
};
