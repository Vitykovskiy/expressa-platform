import {
  ORDER_UUID,
  ORDER_PHONE,
  ORDER_ISO_TIMESTAMP,
  ORDER_SLOT_DURATION,
  ORDER_STAGES,
  ORDER_STAGE_INDEX,
} from "./orders.constants";
import type {
  OrderDto,
  OrderCoreDto,
  OrderSnapshotItem,
  OrderStage,
  OrderHistoryEvent,
} from "./orders.types";

// null означает непригодный ответ; nullable-поля проверяются внутри DTO.
export function parseOrder(value: unknown): OrderDto | null {
  try {
    const source = requireObject(value);
    const core = readCoreOrder(source);
    const customer = requireObject(source.customer);
    const name = customer.name === null ? null : requireText(customer.name);
    const pickup =
      source.pickupSlot === null ? null : requireObject(source.pickupSlot);
    const rejection =
      source.rejection === null ? null : requireObject(source.rejection);
    const pickupSlot =
      pickup === null
        ? null
        : {
            startsAt: requireTimestamp(pickup.startsAt),
            endsAt: requireTimestamp(pickup.endsAt),
          };

    if (
      pickupSlot !== null &&
      Date.parse(pickupSlot.endsAt) - Date.parse(pickupSlot.startsAt) !==
        ORDER_SLOT_DURATION
    ) {
      return null;
    }

    if (rejection !== null && core.stage !== "CREATED") {
      return null;
    }

    return {
      ...core,
      customer: { ...core.customer, name },
      pickupSlot,
      rejection:
        rejection === null
          ? null
          : {
              reason: requireText(rejection.reason),
              at: requireTimestamp(rejection.at),
              actorId: requireUuid(rejection.actorId),
            },
    };
  } catch {
    return null;
  }
}

// Текущие v2 accept/issue возвращают OrderCoreDto; v3 чтение/ready/reject — полный OrderDto.
export function parseOrderCore(value: unknown): OrderCoreDto | null {
  try {
    return readCoreOrder(requireObject(value));
  } catch {
    return null;
  }
}

function readCoreOrder(source: Record<string, unknown>): OrderCoreDto {
  const customer = requireObject(source.customer);
  const phoneE164 = requireText(customer.phoneE164);
  const snapshot = requireCollection(source.snapshot).map(readSnapshotItem);
  const events = requireCollection(source.events).map(readHistoryEvent);
  const currentStage = requireStage(source.stage);
  const total = requireNonnegativeInteger(source.total);
  const sum = snapshot.reduce((amount, row) => amount + row.lineTotal, 0);

  if (
    !ORDER_PHONE.test(phoneE164) ||
    snapshot.length === 0 ||
    !Number.isSafeInteger(sum) ||
    total !== sum
  ) {
    throw new TypeError("Некорректный снимок заказа");
  }

  assertOrderHistory(events, currentStage);

  return {
    id: requireUuid(source.id),
    number: requireText(source.number),
    createdAt: requireTimestamp(source.createdAt),
    total,
    stage: currentStage,
    customer: { id: requireUuid(customer.id), phoneE164 },
    snapshot,
    events,
  };
}

function readHistoryEvent(value: unknown): OrderHistoryEvent {
  const event = requireObject(value);

  return {
    actorId: requireUuid(event.actorId),
    actorLabel: requireText(event.actorLabel),
    occurredAt: requireTimestamp(event.occurredAt),
    from: requireStage(event.from),
    to: requireStage(event.to),
  };
}

function assertOrderHistory(
  events: readonly OrderHistoryEvent[],
  currentStage: OrderStage,
): void {
  // ready может вернуть сразу два события; каждое сохраняет один законный переход.
  for (let index = 0; index < events.length; index += 1) {
    const event = events[index];
    const previous = events[index - 1];

    if (
      event === undefined ||
      ORDER_STAGE_INDEX[event.to] !== ORDER_STAGE_INDEX[event.from] + 1 ||
      (previous !== undefined &&
        (previous.to !== event.from ||
          Date.parse(previous.occurredAt) > Date.parse(event.occurredAt)))
    ) {
      throw new TypeError("Некорректная история заказа");
    }
  }

  if (
    (events.length === 0 && currentStage !== "CREATED") ||
    (events.length > 0 && events[0]?.from !== "CREATED") ||
    (events.length > 0 && events[events.length - 1]?.to !== currentStage)
  ) {
    throw new TypeError("Стадия не соответствует истории заказа");
  }
}

function readSnapshotItem(value: unknown): OrderSnapshotItem {
  const row = requireObject(value);
  const quantity = requireNonnegativeInteger(row.quantity);
  const unitTotal = requireNonnegativeInteger(row.unitTotal);
  const lineTotal = requireNonnegativeInteger(row.lineTotal);
  const modifiers = requireCollection(row.modifiers).map((value) => {
    const modifier = requireObject(value);

    return {
      modifierOptionId: requireUuid(modifier.modifierOptionId),
      modifierName: requireText(modifier.modifierName),
      priceDelta: requireNonnegativeInteger(modifier.priceDelta),
    };
  });

  if (
    quantity === 0 ||
    !Number.isSafeInteger(quantity * unitTotal) ||
    quantity * unitTotal !== lineTotal ||
    new Set(modifiers.map((modifier) => modifier.modifierOptionId)).size !==
      modifiers.length
  ) {
    throw new TypeError("Некорректная позиция заказа");
  }

  return {
    productId: requireUuid(row.productId),
    priceChoiceId:
      row.priceChoiceId === null ? null : requireUuid(row.priceChoiceId),
    productName: requireText(row.productName),
    portionLabel:
      row.portionLabel === null ? null : requireText(row.portionLabel),
    quantity,
    unitTotal,
    lineTotal,
    modifiers,
  };
}

function requireObject(value: unknown): Record<string, unknown> {
  if (!isRecord(value)) {
    throw new TypeError("Некорректный объект заказа");
  }

  return value;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function requireCollection(value: unknown): readonly unknown[] {
  if (!Array.isArray(value)) {
    throw new TypeError("Некорректный список заказа");
  }

  return value;
}

function requireText(value: unknown): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new TypeError("Некорректное поле заказа");
  }

  return value;
}

function requireNonnegativeInteger(value: unknown): number {
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value < 0) {
    throw new TypeError("Некорректная сумма заказа");
  }

  return value;
}

function requireUuid(value: unknown): string {
  const id = requireText(value);

  if (!ORDER_UUID.test(id)) {
    throw new TypeError("Некорректный идентификатор заказа");
  }

  return id;
}

function requireTimestamp(value: unknown): string {
  const result = requireText(value);

  if (
    !ORDER_ISO_TIMESTAMP.test(result) ||
    !Number.isFinite(Date.parse(result))
  ) {
    throw new TypeError("Некорректное время заказа");
  }

  const canonical = result.includes(".")
    ? result.replace(
        /\.(\d{1,3})Z$/,
        (_match, fraction: string) => `.${fraction.padEnd(3, "0")}Z`,
      )
    : result.replace(/Z$/, ".000Z");

  if (new Date(result).toISOString() !== canonical) {
    throw new TypeError("Некорректная календарная дата заказа");
  }

  return result;
}

function requireStage(value: unknown): OrderStage {
  const result = ORDER_STAGES.find((candidate) => candidate === value);

  if (result === undefined) {
    throw new TypeError("Некорректная стадия заказа");
  }

  return result;
}
