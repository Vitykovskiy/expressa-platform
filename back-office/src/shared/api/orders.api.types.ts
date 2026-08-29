export type OrderStage =
  "CREATED" | "ACCEPTED" | "PREPARING" | "READY" | "ISSUED";

export type OrderListItem = {
  id: string;
  number: string;
  createdAt: string;
  total: number;
  stage: OrderStage;
};

export type OrderModifier = {
  modifierOptionId: string;
  modifierName: string;
  priceDelta: number;
};

export type OrderSnapshotItem = {
  productId: string;
  variantId: string | null;
  productName: string;
  size: "S" | "M" | "L" | null;
  quantity: number;
  unitTotal: number;
  lineTotal: number;
  modifiers: readonly OrderModifier[];
};

export type OrderEvent = {
  actorLabel: string;
  occurredAt: string;
  from: OrderStage;
  to: OrderStage;
};

export type OrderEventDto = OrderEvent & {
  actorId: string;
};

export type OrderDetails = OrderListItem & {
  customer: { id: string; phoneE164: string };
  snapshot: readonly OrderSnapshotItem[];
  events: readonly OrderEvent[];
};

export type OrderDetailsDto = Omit<OrderDetails, "events"> & {
  events: readonly OrderEventDto[];
};

export type QueueQuery = {
  number: string;
  stage: OrderStage | null;
};

export type OrderApiError = {
  code: string;
  details: unknown;
  message: string;
  requestId: string | null;
};
