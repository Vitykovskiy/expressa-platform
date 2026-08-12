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
  OrderEvent,
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

  details(accessToken: string, orderId: string): Promise<OrderDetails> {
    return this.request(
      `${ordersApiPaths.orders}/${orderId}`,
      isOrderDetails,
      accessToken,
      "GET",
    );
  }

  transition(accessToken: string, order: OrderDetails): Promise<OrderDetails> {
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

    return this.request(
      `${ordersApiPaths.orders}/${order.id}/${transition}`,
      isOrderDetails,
      accessToken,
      "POST",
    );
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

function isOrderDetails(value: unknown): value is OrderDetails {
  if (!isRecord(value) || !isOrderListItem(value)) return false;

  const record = value as Record<string, unknown>;
  return (
    isRecord(record.customer) &&
    isString(record.customer.id) &&
    isString(record.customer.phoneE164) &&
    Array.isArray(record.snapshot) &&
    record.snapshot.every(isOrderSnapshotItem) &&
    Array.isArray(record.events) &&
    record.events.every(isOrderEvent)
  );
}

function isOrderListItem(value: unknown): value is OrderListItem {
  return (
    isRecord(value) &&
    isString(value.id) &&
    isString(value.number) &&
    isString(value.createdAt) &&
    isNumber(value.totalMinor) &&
    isOrderStage(value.stage)
  );
}

function isOrderSnapshotItem(value: unknown): value is OrderSnapshotItem {
  return (
    isRecord(value) &&
    isString(value.productId) &&
    (isString(value.variantId) || value.variantId === null) &&
    isString(value.productName) &&
    (value.size === "S" ||
      value.size === "M" ||
      value.size === "L" ||
      value.size === null) &&
    isNumber(value.quantity) &&
    isNumber(value.unitTotalMinor) &&
    isNumber(value.lineTotalMinor) &&
    Array.isArray(value.modifiers) &&
    value.modifiers.every(isOrderModifier)
  );
}

function isOrderModifier(value: unknown): value is OrderModifier {
  return (
    isRecord(value) &&
    isString(value.modifierOptionId) &&
    isString(value.modifierName) &&
    isNumber(value.priceDeltaMinor)
  );
}

function isOrderEvent(value: unknown): value is OrderEvent {
  return (
    isRecord(value) &&
    isString(value.actorId) &&
    isString(value.occurredAt) &&
    isOrderStage(value.from) &&
    isOrderStage(value.to)
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

function isNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}
