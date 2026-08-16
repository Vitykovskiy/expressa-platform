import type { CustomerOrder } from "@/shared/api/orders.api";

export interface OrderCardProps {
  order: CustomerOrder;
  stageLabel: string;
}
