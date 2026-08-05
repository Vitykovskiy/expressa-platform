import {
  ordersPaths,
  ordersSizes,
  ordersStages,
  ordersStatuses,
  ordersUuidPattern,
} from "./orders.api.constants";
import type {
  Order,
  OrderItem,
  OrderItemResponse,
  OrderModifier,
  OrderModifierResponse,
  OrderResponse,
  OrdersApi,
  OrdersApiClient,
} from "./orders.api.types";

export type {
  CreateOrderItem,
  CreateOrderRequest,
  Order,
  OrderItem,
  OrderModifier,
  OrdersApi,
} from "./orders.api.types";

export function createOrdersApi(client: OrdersApiClient): OrdersApi {
  return {
    async createOrder(accessToken, request, idempotencyKey): Promise<Order> {
      const response = await client.request(
        ordersPaths.create,
        isOrderResponse,
        {
          body: request,
          expectedStatus: ordersStatuses.created,
          headers: {
            authorization: `Bearer ${accessToken}`,
            "idempotency-key": idempotencyKey,
          },
          method: "POST",
        },
      );

      return toOrder(response);
    },
  };
}

function isOrderResponse(value: unknown): value is OrderResponse {
  return (
    isRecord(value) &&
    isUuid(value.id) &&
    typeof value.number === "string" &&
    ordersStages.some((stage) => stage === value.stage) &&
    isInteger(value.totalMinor) &&
    isArrayOf(value.items, isOrderItemResponse)
  );
}

function isOrderItemResponse(value: unknown): value is OrderItemResponse {
  return (
    isRecord(value) &&
    isUuid(value.productId) &&
    (value.variantId === null || isUuid(value.variantId)) &&
    typeof value.productName === "string" &&
    (value.size === null || ordersSizes.some((size) => size === value.size)) &&
    isInteger(value.quantity) &&
    isInteger(value.unitTotalMinor) &&
    isInteger(value.lineTotalMinor) &&
    isArrayOf(value.modifiers, isOrderModifierResponse)
  );
}

function isOrderModifierResponse(
  value: unknown,
): value is OrderModifierResponse {
  return (
    isRecord(value) &&
    isUuid(value.modifierOptionId) &&
    typeof value.modifierName === "string" &&
    isInteger(value.priceDeltaMinor)
  );
}

function toOrder(response: OrderResponse): Order {
  return {
    id: response.id,
    number: response.number,
    stage: response.stage,
    totalMinor: response.totalMinor,
    items: response.items.map(toOrderItem),
  };
}

function toOrderItem(response: OrderItemResponse): OrderItem {
  return {
    productId: response.productId,
    variantId: response.variantId,
    productName: response.productName,
    size: response.size,
    quantity: response.quantity,
    unitTotalMinor: response.unitTotalMinor,
    lineTotalMinor: response.lineTotalMinor,
    modifiers: response.modifiers.map(toOrderModifier),
  };
}

function toOrderModifier(response: OrderModifierResponse): OrderModifier {
  return {
    modifierOptionId: response.modifierOptionId,
    modifierName: response.modifierName,
    priceDeltaMinor: response.priceDeltaMinor,
  };
}

function isArrayOf<T>(
  value: unknown,
  predicate: (item: unknown) => item is T,
): value is T[] {
  return Array.isArray(value) && value.every(predicate);
}

function isInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isUuid(value: unknown): value is string {
  return typeof value === "string" && ordersUuidPattern.test(value);
}
