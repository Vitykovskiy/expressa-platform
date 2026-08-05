import type { ApiClient } from "./client";

export type OrdersApi = {
  createOrder(
    accessToken: string,
    request: CreateOrderRequest,
    idempotencyKey: string,
  ): Promise<Order>;
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
