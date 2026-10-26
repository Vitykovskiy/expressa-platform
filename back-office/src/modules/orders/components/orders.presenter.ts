import { ORDER_MESSAGES, ORDER_STAGE_LABELS } from "../orders.constants";
import type {
  OrderHistoryEvent,
  OrderRecord,
  OrderSnapshotItem,
} from "../orders.types";
import type {
  OrderCardDetails,
  OrderCardEvent,
  OrderCardLine,
  OrderCardModel,
} from "./OrderCard.types";
import {
  SOURCE_ORDER_STAGES,
  ORDER_TIME_FORMAT,
  ORDER_DATE_FORMAT,
} from "./orders.presenter.constants";

/** Получает проверенную модель заказа; состав и история берутся из его снимков. */
export function toOrderCard(order: OrderRecord): OrderCardModel {
  const pickup = order.pickupSlot;
  const rejection = order.rejection;

  return {
    id: order.id,
    number: `#${order.number}`,
    stage: rejection === null ? SOURCE_ORDER_STAGES[order.stage] : "rejected",
    pickupTime:
      pickup === null
        ? ORDER_MESSAGES.missingPickup
        : ORDER_TIME_FORMAT.format(new Date(pickup.startsAt)),
    customerName:
      order.customerName === null
        ? ORDER_MESSAGES.missingName
        : order.customerName,
    itemsSummary: order.items.map(formatItemLabel).join(", "),
    totalLabel: `${order.total} ₽`,
    details: toOrderDetails(order),
  };
}

function toOrderDetails(order: OrderRecord): OrderCardDetails {
  const pickup = order.pickupSlot;
  const rejection = order.rejection;

  return {
    phone: order.customerPhone,
    createdAt: ORDER_DATE_FORMAT.format(new Date(order.createdAt)),
    pickup:
      pickup === null
        ? ORDER_MESSAGES.missingPickup
        : `${ORDER_TIME_FORMAT.format(new Date(pickup.startsAt))}–${ORDER_TIME_FORMAT.format(new Date(pickup.endsAt))}`,
    // Позиции и события снимка неизменяемы: индекс сохраняет исходную идентичность.
    lines: order.items.map((item, index) =>
      toCardLine(item, `${order.id}:${index}`),
    ),
    events: order.events.map((event, index) =>
      toCardEvent(event, `${order.id}:${index}`),
    ),
    rejection:
      rejection === null
        ? null
        : `Отклонён: ${rejection.reason} · ${ORDER_DATE_FORMAT.format(new Date(rejection.at))} · ${rejection.actorId}`,
  };
}

function toCardLine(item: OrderSnapshotItem, key: string): OrderCardLine {
  const modifiers = item.modifiers.map(
    (modifier) => `${modifier.modifierName} (+${modifier.priceDelta} ₽)`,
  );

  return {
    key,
    label: formatItemLabel(item),
    modifiers: modifiers.length === 0 ? null : modifiers.join(", "),
    total: `${item.lineTotal} ₽`,
  };
}

function toCardEvent(event: OrderHistoryEvent, key: string): OrderCardEvent {
  const occurredAt = ORDER_DATE_FORMAT.format(new Date(event.occurredAt));
  const fromStage = ORDER_STAGE_LABELS[event.from];
  const toStage = ORDER_STAGE_LABELS[event.to];

  return {
    key,
    label: `${occurredAt} · ${fromStage} → ${toStage} · ${event.actorLabel}`,
  };
}

function formatItemLabel(item: OrderSnapshotItem): string {
  const portion = item.portionLabel === null ? "" : ` ${item.portionLabel}`;
  const quantity = item.quantity === 1 ? "" : `${item.quantity} × `;

  return `${quantity}${item.productName}${portion}`;
}
