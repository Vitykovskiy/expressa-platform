import type { ApiClient } from "./client";

export type OrdersApi = {
  createOrder(
    accessToken: string,
    request: CreateOrderRequest,
    idempotencyKey: string,
  ): Promise<Order>;
};

export type CustomerOrdersApi = OrdersApi & {
  getOrder(accessToken: string, orderId: string): Promise<CustomerOrder>;
  listOrders(accessToken: string, cursor?: string): Promise<CustomerOrdersPage>;
};

export type OrdersApiClient = Pick<ApiClient, "request">;

export type CreateOrderRequest = {
  expectedTotalMinor: number;
  items: CreateOrderItem[];
};

export type CreateOrderItem = {
  productId: string;
  variantId: string | null;
  modifierOptionIds: string[];
  quantity: number;
};

export type Order = {
  id: string;
  number: string;
  stage: "CREATED";
  totalMinor: number;
  items: OrderItem[];
};

export type CustomerOrderStage =
  "CREATED" | "ACCEPTED" | "PREPARING" | "READY" | "ISSUED";

export type CustomerOrder = {
  createdAt: string;
  id: string;
  items: OrderItem[];
  number: string;
  stage: CustomerOrderStage;
  totalMinor: number;
};

export type CustomerOrdersPage = {
  nextCursor: string | null;
  orders: CustomerOrder[];
};

export type OrderItem = {
  productId: string;
  variantId: string | null;
  productName: string;
  size: "S" | "M" | "L" | null;
  quantity: number;
  unitTotalMinor: number;
  lineTotalMinor: number;
  modifiers: OrderModifier[];
};

export type OrderModifier = {
  modifierOptionId: string;
  modifierName: string;
  priceDeltaMinor: number;
};

export type CustomerOrderResponse = {
  createdAt: string;
  id: string;
  number: string;
  snapshot: OrderItemResponse[];
  stage: CustomerOrderStage;
  totalMinor: number;
};

export type CustomerOrdersPageResponse = {
  nextCursor: string | null;
  orders: CustomerOrderResponse[];
};

export type OrderResponse = {
  id: string;
  number: string;
  stage: "CREATED";
  totalMinor: number;
  items: OrderItemResponse[];
};

export type OrderItemResponse = {
  productId: string;
  variantId: string | null;
  productName: string;
  size: "S" | "M" | "L" | null;
  quantity: number;
  unitTotalMinor: number;
  lineTotalMinor: number;
  modifiers: OrderModifierResponse[];
};

export type OrderModifierResponse = {
  modifierOptionId: string;
  modifierName: string;
  priceDeltaMinor: number;
};
