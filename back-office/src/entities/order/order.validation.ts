import { contractFailure, isRecord } from "../../shared/api/transport";
import {
  orderPhonePattern,
  orderStages,
  timestampPattern,
  uuidPattern,
} from "./order.constants";
import type {
  OrderDto,
  OrderEventDto,
  OrderItemDto,
  OrderModifierDto,
  OrderStage,
} from "./order.types";

function text(value: unknown): value is string {
  return typeof value === "string" && value.trim() !== "";
}

function number(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function timestamp(value: unknown): value is string {
  return (
    typeof value === "string" &&
    timestampPattern.test(value) &&
    Number.isFinite(Date.parse(value))
  );
}

export function isOrderStage(value: unknown): value is OrderStage {
  return typeof value === "string" && orderStages.includes(value as OrderStage);
}

function parseModifier(value: unknown): OrderModifierDto {
  if (
    !isRecord(value) ||
    !text(value.modifierOptionId) ||
    !text(value.modifierName) ||
    !number(value.priceDelta)
  ) {
    return contractFailure();
  }

  return {
    modifierOptionId: value.modifierOptionId,
    modifierName: value.modifierName,
    priceDelta: value.priceDelta,
  };
}

function parseItem(value: unknown): OrderItemDto {
  if (
    !isRecord(value) ||
    !text(value.productId) ||
    !(value.priceChoiceId === null || text(value.priceChoiceId)) ||
    !text(value.productName) ||
    !(value.portionLabel === null || text(value.portionLabel)) ||
    !number(value.quantity) ||
    !number(value.unitTotal) ||
    !number(value.lineTotal) ||
    !Array.isArray(value.modifiers)
  ) {
    return contractFailure();
  }

  return {
    productId: value.productId,
    priceChoiceId: value.priceChoiceId,
    productName: value.productName,
    portionLabel: value.portionLabel,
    quantity: value.quantity,
    unitTotal: value.unitTotal,
    lineTotal: value.lineTotal,
    modifiers: value.modifiers.map(parseModifier),
  };
}

function parseEvent(value: unknown): OrderEventDto {
  if (
    !isRecord(value) ||
    !text(value.actorId) ||
    !uuidPattern.test(value.actorId) ||
    !text(value.actorLabel) ||
    !orderPhonePattern.test(value.actorLabel) ||
    !timestamp(value.occurredAt) ||
    !isOrderStage(value.from) ||
    !isOrderStage(value.to)
  ) {
    return contractFailure();
  }

  return {
    actorId: value.actorId,
    actorLabel: value.actorLabel,
    occurredAt: value.occurredAt,
    from: value.from,
    to: value.to,
  };
}

export function parseOrder(value: unknown): OrderDto {
  if (
    !isRecord(value) ||
    !text(value.id) ||
    !uuidPattern.test(value.id) ||
    !text(value.number) ||
    !timestamp(value.createdAt) ||
    !number(value.total) ||
    !isOrderStage(value.stage) ||
    !isRecord(value.customer) ||
    !text(value.customer.id) ||
    !uuidPattern.test(value.customer.id) ||
    !text(value.customer.phoneE164) ||
    !orderPhonePattern.test(value.customer.phoneE164) ||
    !Array.isArray(value.snapshot) ||
    !Array.isArray(value.events)
  ) {
    return contractFailure();
  }

  return {
    id: value.id,
    number: value.number,
    createdAt: value.createdAt,
    total: value.total,
    stage: value.stage,
    customer: { id: value.customer.id, phoneE164: value.customer.phoneE164 },
    snapshot: value.snapshot.map(parseItem),
    events: value.events.map(parseEvent),
  };
}
