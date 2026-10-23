import {
  ORDER_MESSAGES,
  ORDER_STAGE_LABELS,
} from "../../../entities/orders/orders.constants";
import type {
  OrderRecord,
  OrderSnapshotItem,
} from "../../../entities/orders/orders.types";
import type { OrderCardModel } from "./OrderCard.types";
import {
  SOURCE_ORDER_STAGES,
  ORDER_TIME_FORMAT,
  ORDER_DATE_FORMAT,
} from "./orders.presenter.constants";

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
    itemsSummary: order.items.map(itemLabel).join(", "),
    totalLabel: `${order.total} ₽`,
    details: {
      phone: order.customerPhone,
      createdAt: ORDER_DATE_FORMAT.format(new Date(order.createdAt)),
      pickup:
        pickup === null
          ? ORDER_MESSAGES.missingPickup
          : `${ORDER_TIME_FORMAT.format(new Date(pickup.startsAt))}–${ORDER_TIME_FORMAT.format(new Date(pickup.endsAt))}`,
      lines: order.items.map((item, index) => ({
        key: `${order.id}:${index}`,
        label: itemLabel(item),
        modifiers:
          item.modifiers.length === 0
            ? null
            : item.modifiers
                .map(
                  (modifier) =>
                    `${modifier.modifierName} (+${modifier.priceDelta} ₽)`,
                )
                .join(", "),
        total: `${item.lineTotal} ₽`,
      })),
      events: order.events.map((event, index) => ({
        key: `${order.id}:${index}`,
        label: `${ORDER_DATE_FORMAT.format(new Date(event.occurredAt))} · ${ORDER_STAGE_LABELS[event.from]} → ${ORDER_STAGE_LABELS[event.to]} · ${event.actorLabel}`,
      })),
      rejection:
        rejection === null
          ? null
          : `Отклонён: ${rejection.reason} · ${ORDER_DATE_FORMAT.format(new Date(rejection.at))} · ${rejection.actorId}`,
    },
  };
}

function itemLabel(item: OrderSnapshotItem): string {
  const portion = item.portionLabel === null ? "" : ` ${item.portionLabel}`;
  const quantity = item.quantity === 1 ? "" : `${item.quantity} × `;

  return `${quantity}${item.productName}${portion}`;
}
