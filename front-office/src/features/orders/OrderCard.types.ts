import type { Order } from "@/entities/customer/model/customer.types";

export interface OrderCardProps {
  order: Order;
  statusLabel: string;
  expanded: boolean;
}

export interface OrderCardEmits {
  toggle: [];
}
