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
  expectedTotal: number;
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
  total: number;
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
  total: number;
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
  unitTotal: number;
  lineTotal: number;
  modifiers: OrderModifier[];
};

export type OrderModifier = {
  modifierOptionId: string;
  modifierName: string;
  priceDelta: number;
};

export type CustomerOrderResponse = {
  createdAt: string;
  id: string;
  number: string;
  snapshot: OrderItemResponse[];
  stage: CustomerOrderStage;
  total: number;
};

export type CustomerOrdersPageResponse = {
  nextCursor: string | null;
  orders: CustomerOrderResponse[];
};

export type OrderResponse = {
  id: string;
  number: string;
  stage: "CREATED";
  total: number;
  items: OrderItemResponse[];
};

export type OrderItemResponse = {
  productId: string;
  variantId: string | null;
  productName: string;
  size: "S" | "M" | "L" | null;
  quantity: number;
  unitTotal: number;
  lineTotal: number;
  modifiers: OrderModifierResponse[];
};

export type OrderModifierResponse = {
  modifierOptionId: string;
  modifierName: string;
  priceDelta: number;
};
