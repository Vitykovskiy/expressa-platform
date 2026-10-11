import type { DeepReadonly } from "vue";
import type { Order } from "../../entities/order/order.types";

export interface OrderDetailProps {
  order: DeepReadonly<Order> | null;
  selected: boolean;
  loading: boolean;
  error: string;
  updatedAt: string | null;
}
export interface OrderDetailEmits {
  retry: [];
}

export interface OrderDetailSlots {
  action(): unknown;
}
