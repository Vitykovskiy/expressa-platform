import { bearerTokenType } from "./auth.api.constants";
import { ApiClient, ApiError } from "./client";
import {
  ordersApiPaths,
  orderStages,
  orderTransitions,
} from "./orders.api.constants";
import type {
  OrderApiError,
  OrderDetails,
  OrderDetailsDto,
  OrderEventDto,
  OrderListItem,
  OrderModifier,
  OrderSnapshotItem,
  OrderStage,
  QueueQuery,
} from "./orders.api.types";

export class OrdersApi {
  constructor(private readonly client: ApiClient) {}

  async list(
    accessToken: string,
    query: QueueQuery,
  ): Promise<readonly OrderListItem[]> {
    const search = new URLSearchParams();
    if (query.number) search.set("number", query.number);
    if (query.stage) search.set("stage", query.stage);
    const suffix = search.size === 0 ? "" : `?${search.toString()}`;

    return this.request(
      `${ordersApiPaths.orders}${suffix}`,
      isOrderList,
      accessToken,
      "GET",
    );
  }

  async details(accessToken: string, orderId: string): Promise<OrderDetails> {
    const details = await this.request(
      `${ordersApiPaths.orders}/${orderId}`,
      isOrderDetailsDto,
      accessToken,
      "GET",
    );

    return toOrderDetails(details);
  }

  async transition(
    accessToken: string,
    order: OrderDetails,
  ): Promise<OrderDetails> {
    const transition =
      orderTransitions[order.stage as keyof typeof orderTransitions];
    if (transition === undefined) {
      return Promise.reject({
        code: "ORDER_STAGE_FINAL",
        details: null,
        message: "Заказ уже выдан.",
        requestId: null,
      } satisfies OrderApiError);
    }

    await this.request(
      `${ordersApiPaths.transitions}/${order.id}/${transition}`,
      isOrderListItem,
      accessToken,
      "POST",
    );

    return this.details(accessToken, order.id);
  }

  private async request<T>(
    path: string,
    validate: (value: unknown) => value is T,
    accessToken: string,
    method: "GET" | "POST",
  ): Promise<T> {
    try {
      return await this.client.request(path, validate, {
        expectedStatus: 200,
        headers: { authorization: `${bearerTokenType} ${accessToken}` },
        method,
      });
    } catch (error) {
      throw toOrderApiError(error);
    }
  }
}

function toOrderApiError(error: unknown): OrderApiError {
  if (error instanceof ApiError) {
    return error;
  }

  if (isOrderApiError(error)) return error;

  return {
    code: "API_CONTRACT_ERROR",
    details: null,
    message: "Сервис заказов вернул некорректный ответ.",
    requestId: null,
  };
}

function isOrderList(value: unknown): value is readonly OrderListItem[] {
  return Array.isArray(value) && value.every(isOrderListItem);
}

function toOrderDetails(details: OrderDetailsDto): OrderDetails {
  return {
    ...details,
    events: details.events.map((event) => ({
      actorLabel: event.actorLabel,
      from: event.from,
      occurredAt: event.occurredAt,
      to: event.to,
    })),
  };
}

function isOrderDetailsDto(value: unknown): value is OrderDetailsDto {
  if (!isRecord(value) || !isOrderListItem(value)) return false;

  const record = value as Record<string, unknown>;
  return (
    isOrderCustomer(record.customer) &&
    Array.isArray(record.snapshot) &&
    record.snapshot.every(isOrderSnapshotItem) &&
    Array.isArray(record.events) &&
    record.events.every(isOrderEventDto)
  );
}

function isOrderCustomer(
  value: unknown,
): value is { id: string; phoneE164: string } {
  if (!isRecord(value)) return false;

  return isUuid(value.id) && isPhoneE164(value.phoneE164);
}

function isOrderEventDto(value: unknown): value is OrderEventDto {
  if (!isRecord(value)) return false;

  return (
    isUuid(value.actorId) &&
    isNonEmptyString(value.actorLabel) &&
    isIsoDateTime(value.occurredAt) &&
    isOrderStage(value.from) &&
    isOrderStage(value.to)
  );
}

function isOrderListItem(value: unknown): value is OrderListItem {
  return (
    isRecord(value) &&
    isString(value.id) &&
    isString(value.number) &&
    isString(value.createdAt) &&
    isNonNegativeInteger(value.total) &&
    isOrderStage(value.stage)
  );
}

function isOrderSnapshotItem(value: unknown): value is OrderSnapshotItem {
  return (
    isRecord(value) &&
    isString(value.productId) &&
    (isString(value.priceChoiceId) || value.priceChoiceId === null) &&
    isString(value.productName) &&
    (isString(value.portionLabel) || value.portionLabel === null) &&
    isNumber(value.quantity) &&
    isNonNegativeInteger(value.unitTotal) &&
    isNonNegativeInteger(value.lineTotal) &&
    Array.isArray(value.modifiers) &&
    value.modifiers.every(isOrderModifier)
  );
}

function isOrderModifier(value: unknown): value is OrderModifier {
  return (
    isRecord(value) &&
    isString(value.modifierOptionId) &&
    isString(value.modifierName) &&
    isNonNegativeInteger(value.priceDelta)
  );
}

function isOrderApiError(value: unknown): value is OrderApiError {
  return (
    isRecord(value) &&
    isString(value.code) &&
    isString(value.message) &&
    "details" in value &&
    (isString(value.requestId) || value.requestId === null)
  );
}

function isOrderStage(value: unknown): value is OrderStage {
  return (
    typeof value === "string" && orderStages.some((stage) => stage === value)
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isString(value: unknown): value is string {
  return typeof value === "string";
}

function isNonEmptyString(value: unknown): value is string {
  return isString(value) && value.trim() !== "";
}

function isUuid(value: unknown): value is string {
  return (
    isString(value) &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      value,
    )
  );
}

function isPhoneE164(value: unknown): value is string {
  return isString(value) && /^\+[1-9]\d{1,14}$/.test(value);
}

function isIsoDateTime(value: unknown): value is string {
  return isString(value) && !Number.isNaN(Date.parse(value));
}

function isNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isNonNegativeInteger(value: unknown): value is number {
  return (
    isNumber(value) &&
    Number.isInteger(value) &&
    value >= 0 &&
    value <= 2_147_483_647
  );
}
