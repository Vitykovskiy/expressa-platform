import {
  customerOrderStages,
  ordersPaths,
  ordersSizes,
  ordersStages,
  ordersStatuses,
  ordersUuidPattern,
} from "./orders.api.constants";
import type {
  CustomerOrder,
  CustomerOrderResponse,
  CustomerOrdersApi,
  CustomerOrdersPage,
  CustomerOrdersPageResponse,
  Order,
  OrderItem,
  OrderItemResponse,
  OrderModifier,
  OrderModifierResponse,
  OrderResponse,
  OrdersApiClient,
} from "./orders.api.types";

export type {
  CreateOrderItem,
  CreateOrderRequest,
  Order,
  CustomerOrder,
  CustomerOrdersPage,
  OrderItem,
  OrderModifier,
  OrdersApi,
} from "./orders.api.types";

export function createOrdersApi(client: OrdersApiClient): CustomerOrdersApi {
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
    async getOrder(accessToken, orderId): Promise<CustomerOrder> {
      const response = await client.request(
        ordersPaths.details(orderId),
        isCustomerOrderResponse,
        {
          expectedStatus: ordersStatuses.success,
          headers: bearer(accessToken),
          method: "GET",
        },
      );

      return toCustomerOrder(response);
    },
    async listOrders(accessToken, cursor): Promise<CustomerOrdersPage> {
      const path =
        cursor === undefined
          ? ordersPaths.list
          : `${ordersPaths.list}?cursor=${encodeURIComponent(cursor)}`;
      const response = await client.request(
        path,
        isCustomerOrdersPageResponse,
        {
          expectedStatus: ordersStatuses.success,
          headers: bearer(accessToken),
          method: "GET",
        },
      );

      return {
        nextCursor: response.nextCursor,
        orders: response.orders.map(toCustomerOrder),
      };
    },
  };
}

function bearer(accessToken: string): Record<string, string> {
  return { authorization: `Bearer ${accessToken}` };
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

function isCustomerOrdersPageResponse(
  value: unknown,
): value is CustomerOrdersPageResponse {
  return (
    isRecord(value) &&
    (value.nextCursor === null || typeof value.nextCursor === "string") &&
    isArrayOf(value.orders, isCustomerOrderResponse)
  );
}

function isCustomerOrderResponse(
  value: unknown,
): value is CustomerOrderResponse {
  return (
    isRecord(value) &&
    isUuid(value.id) &&
    typeof value.number === "string" &&
    typeof value.createdAt === "string" &&
    !Number.isNaN(Date.parse(value.createdAt)) &&
    customerOrderStages.some((stage) => stage === value.stage) &&
    isInteger(value.totalMinor) &&
    isArrayOf(value.snapshot, isOrderItemResponse)
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

function toCustomerOrder(response: CustomerOrderResponse): CustomerOrder {
  return {
    createdAt: response.createdAt,
    id: response.id,
    items: response.snapshot.map(toOrderItem),
    number: response.number,
    stage: response.stage,
    totalMinor: response.totalMinor,
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
