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
} from "./orders.types";

export function parseOrder(value: unknown): OrderDto | null {
  try {
    const source = object(value);
    const core = coreOrder(source);
    const customer = object(source.customer);
    const name = customer.name === null ? null : text(customer.name);
    const pickup =
      source.pickupSlot === null ? null : object(source.pickupSlot);
    const rejection =
      source.rejection === null ? null : object(source.rejection);
    const pickupSlot =
      pickup === null
        ? null
        : {
            startsAt: timestamp(pickup.startsAt),
            endsAt: timestamp(pickup.endsAt),
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
              reason: text(rejection.reason),
              at: timestamp(rejection.at),
              actorId: uuid(rejection.actorId),
            },
    };
  } catch {
    return null;
  }
}

export function parseLegacyOrder(value: unknown): OrderCoreDto | null {
  try {
    return coreOrder(object(value));
  } catch {
    return null;
  }
}

function coreOrder(source: Record<string, unknown>): OrderCoreDto {
  const customer = object(source.customer);
  const phoneE164 = text(customer.phoneE164);
  const snapshot = collection(source.snapshot).map(item);
  const events = collection(source.events).map((value) => {
    const event = object(value);

    return {
      actorId: uuid(event.actorId),
      actorLabel: text(event.actorLabel),
      occurredAt: timestamp(event.occurredAt),
      from: stage(event.from),
      to: stage(event.to),
    };
  });
  const currentStage = stage(source.stage);
  const total = integer(source.total);
  const sum = snapshot.reduce((amount, row) => amount + row.lineTotal, 0);

  if (
    !ORDER_PHONE.test(phoneE164) ||
    snapshot.length === 0 ||
    !Number.isSafeInteger(sum) ||
    total !== sum
  ) {
    throw new TypeError("Некорректный снимок заказа");
  }

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

  return {
    id: uuid(source.id),
    number: text(source.number),
    createdAt: timestamp(source.createdAt),
    total,
    stage: currentStage,
    customer: { id: uuid(customer.id), phoneE164 },
    snapshot,
    events,
  };
}

function item(value: unknown): OrderSnapshotItem {
  const row = object(value);
  const quantity = integer(row.quantity);
  const unitTotal = integer(row.unitTotal);
  const lineTotal = integer(row.lineTotal);
  const modifiers = collection(row.modifiers).map((value) => {
    const modifier = object(value);

    return {
      modifierOptionId: uuid(modifier.modifierOptionId),
      modifierName: text(modifier.modifierName),
      priceDelta: integer(modifier.priceDelta),
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
    productId: uuid(row.productId),
    priceChoiceId: row.priceChoiceId === null ? null : uuid(row.priceChoiceId),
    productName: text(row.productName),
    portionLabel: row.portionLabel === null ? null : text(row.portionLabel),
    quantity,
    unitTotal,
    lineTotal,
    modifiers,
  };
}

function object(value: unknown): Record<string, unknown> {
  if (!isRecord(value)) {
    throw new TypeError("Некорректный объект заказа");
  }

  return value;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function collection(value: unknown): readonly unknown[] {
  if (!Array.isArray(value)) {
    throw new TypeError("Некорректный список заказа");
  }

  return value;
}

function text(value: unknown): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new TypeError("Некорректное поле заказа");
  }

  return value;
}

function integer(value: unknown): number {
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value < 0) {
    throw new TypeError("Некорректная сумма заказа");
  }

  return value;
}

function uuid(value: unknown): string {
  const id = text(value);

  if (!ORDER_UUID.test(id)) {
    throw new TypeError("Некорректный идентификатор заказа");
  }

  return id;
}

function timestamp(value: unknown): string {
  const result = text(value);

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

function stage(value: unknown): OrderStage {
  const result = ORDER_STAGES.find((candidate) => candidate === value);

  if (result === undefined) {
    throw new TypeError("Некорректная стадия заказа");
  }

  return result;
}
