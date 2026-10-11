import type { OrderFilters } from "../entities/order/order.types";

export type StaffSection = "orders" | "availability" | "catalog";

export interface OrderLocation {
  href: string;
  section: StaffSection;
  filters: OrderFilters;
  orderId: string | null;
  error: string;
}
