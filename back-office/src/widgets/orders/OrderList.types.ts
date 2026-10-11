import type { DeepReadonly } from "vue";
import type { Order } from "../../entities/order/order.types";

export interface OrderListProps {
  orders: readonly DeepReadonly<Order>[] | null;
  selectedId: string | null;
  loading: boolean;
  error: string;
  updatedAt: string | null;
  filtered: boolean;
}
export interface OrderListEmits {
  select: [id: string];
  retry: [];
  reset: [];
}
