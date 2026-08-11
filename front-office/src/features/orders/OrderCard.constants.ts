import type { UiBadgeTone } from "@/shared/ui/customer/badge/UiBadge.types";
import type { OrderStatus } from "@/entities/customer/model/customer.types";

export const ORDER_STATUS_TONES = {
  pending: "warning",
  preparing: "info",
  ready: "success",
  completed: "neutral",
  cancelled: "neutral",
} satisfies Record<OrderStatus, UiBadgeTone>;
