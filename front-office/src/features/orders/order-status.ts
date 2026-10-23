import type {
  CustomerOrder,
  OrderPickupSlot,
} from "@/shared/api/orders.api.types";
import {
  datedOrderNumberPattern,
  orderCreationDateFormat,
  orderPickupTimeFormat,
  orderStatusMessages,
} from "./order-status.constants";

export function isOrderRejected(order: CustomerOrder): boolean {
  return order.rejection != null;
}

export function isOrderTerminal(order: CustomerOrder): boolean {
  return isOrderRejected(order) || order.stage === "ISSUED";
}

export function formatCustomerOrderNumber(number: string): string {
  const dailyNumber = datedOrderNumberPattern.exec(number)?.[1];

  if (dailyNumber === undefined || dailyNumber === "000") {
    return number;
  }

  return dailyNumber;
}

export function formatOrderCreatedAt(createdAt: string): string {
  return new Intl.DateTimeFormat("ru-RU", orderCreationDateFormat).format(
    new Date(createdAt),
  );
}

export function formatHistoricalOrderDate(
  createdAt: string,
  now: Date,
): string | null {
  // День сервиса не зависит от часового пояса устройства.
  const creationDay = new Date(createdAt).toISOString().slice(0, 10);
  const currentDay = now.toISOString().slice(0, 10);

  if (creationDay === currentDay) {
    return null;
  }

  return `Создан ${formatOrderCreatedAt(createdAt)}`;
}

export function formatOrderPickupSlot(
  slot: OrderPickupSlot | null | undefined,
): string {
  if (slot == null) {
    return orderStatusMessages.pickupUnassigned;
  }

  const start = new Intl.DateTimeFormat("ru-RU", orderPickupTimeFormat).format(
    new Date(slot.startsAt),
  );
  const end = new Intl.DateTimeFormat("ru-RU", orderPickupTimeFormat).format(
    new Date(slot.endsAt),
  );

  return `Время получения: ${start}–${end}`;
}
