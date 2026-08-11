import type { AdminButtonVariant } from "../../../shared/ui/admin/admin-button/AdminButton.types";
import type {
  Order,
  OrderAction,
  OrderStatus,
} from "../../../shared/ui/admin/Admin.types";

export interface OrderCardProps {
  order: Order;
}

export interface OrderCardEmits {
  action: [action: OrderAction];
}

export type OrderCardActionPresentation = {
  action: OrderAction;
  label: string;
  variant?: AdminButtonVariant;
};

export type OrderCardActionPresentationMap = Record<
  OrderStatus,
  readonly OrderCardActionPresentation[]
>;
