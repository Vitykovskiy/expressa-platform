import type { UiBadgeTone } from "../../shared/ui/badge/UiBadge.types";
import type { OrderStatus } from "../../shared/model/customer.types";

export const ORDER_STATUS_TONES = {
  pending: "warning",
  preparing: "info",
  ready: "success",
  completed: "neutral",
  cancelled: "neutral",
} satisfies Record<OrderStatus, UiBadgeTone>;
