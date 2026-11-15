import type { CartItem } from "@/entities/customer/model/customer.types";
import type { Order, OrdersApi } from "@/shared/api/orders.api";

export type CheckoutStatus =
  "idle" | "submitting" | "reconfirmation-required" | "succeeded" | "error";

export type CheckoutErrorCode =
  | "INVALID_CART"
  | "NETWORK_ERROR"
  | "ORDER_TOTAL_CHANGED"
  | "MENU_ITEM_UNAVAILABLE"
  | "ORDER_INTAKE_CLOSED"
  | "ORDER_CAPACITY_UNAVAILABLE"
  | "PICKUP_SLOT_UNAVAILABLE"
  | "UNKNOWN_ERROR";

export type CheckoutAttempt = {
  cartItemIdsByAddressableId: Record<string, string[]>;
  idempotencyKey: string;
  request: CheckoutRequest;
};

export type CheckoutRequest = {
  pickupSlotStart?: string;
  expectedTotal: number;
  items: CheckoutRequestItem[];
};

export type CheckoutRequestItem = {
  modifierOptionIds: string[];
  productId: string;
  quantity: number;
  priceChoiceId?: string;
};

export type CheckoutState = {
  rejectedPickupSlotStart: string | null;
  attempt: CheckoutAttempt | null;
  errorCode: CheckoutErrorCode | null;
  errorMessage: string | null;
  order: Order | null;
  reconfirmedTotal: number | null;
  status: CheckoutStatus;
  submitPromise: Promise<Order | null> | null;
  unavailableCartItemIds: string[];
};

export type CheckoutStoreDependencies = {
  createIdempotencyKey(): string;
  ordersApi: OrdersApi;
};

export type CheckoutSubmission = {
  pickupSlotStart?: string;
  accessToken: string;
  cartItems: readonly CartItem[];
};
