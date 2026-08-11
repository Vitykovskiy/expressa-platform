import type { OrderStatus } from "../Admin.types";

export interface StatusBadgeProps {
  status: OrderStatus;
}

export interface StatusPresentation {
  label: string;
  className: string;
}
