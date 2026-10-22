import type {
  CustomerOrder,
  OrderPickupSlot,
} from "@/shared/api/orders.api.types";
import {
  orderPickupDateFormat,
  orderPickupTimeFormat,
  orderStatusMessages,
} from "./order-status.constants";

export function isOrderRejected(order: CustomerOrder): boolean {
  return order.rejection != null;
}

export function isOrderTerminal(order: CustomerOrder): boolean {
  return isOrderRejected(order) || order.stage === "ISSUED";
}

export function formatOrderPickupSlot(
  slot: OrderPickupSlot | null | undefined,
): string {
  if (slot == null) {
    return orderStatusMessages.pickupUnassigned;
  }

  const start = new Intl.DateTimeFormat("ru-RU", orderPickupDateFormat).format(
    new Date(slot.startsAt),
  );
  const end = new Intl.DateTimeFormat("ru-RU", orderPickupTimeFormat).format(
    new Date(slot.endsAt),
  );

  return `Время получения: ${start} — ${end} (UTC)`;
}
