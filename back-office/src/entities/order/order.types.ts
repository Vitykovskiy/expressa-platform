export type OrderStage =
  "CREATED" | "ACCEPTED" | "PREPARING" | "READY" | "ISSUED";
export interface OrderModifierDto {
  modifierOptionId: string;
  modifierName: string;
  priceDelta: number;
}
export interface OrderItemDto {
  productId: string;
  priceChoiceId: string | null;
  productName: string;
  portionLabel: string | null;
  quantity: number;
  unitTotal: number;
  lineTotal: number;
  modifiers: OrderModifierDto[];
}
export interface OrderEventDto {
  actorId: string;
  actorLabel: string;
  occurredAt: string;
  from: OrderStage;
  to: OrderStage;
}
export interface OrderDto {
  id: string;
  number: string;
  createdAt: string;
  total: number;
  stage: OrderStage;
  customer: { id: string; phoneE164: string };
  snapshot: OrderItemDto[];
  events: OrderEventDto[];
}
export interface OrderItem {
  productId: string;
  priceChoiceId: string | null;
  name: string;
  portion: string | null;
  quantity: number;
  unitTotal: number;
  lineTotal: number;
  modifiers: { id: string; name: string; priceDelta: number }[];
}
export interface OrderEvent {
  actorId: string;
  actorPhone: string;
  occurredAt: string;
  from: OrderStage;
  to: OrderStage;
}
export interface Order {
  id: string;
  number: string;
  createdAt: string;
  total: number;
  stage: OrderStage;
  customerId: string;
  customerPhone: string;
  items: OrderItem[];
  events: OrderEvent[];
}
export interface OrderFilters {
  number: string | null;
  stage: OrderStage | null;
}

export type OrderAction = "accept" | "startPreparing" | "markReady" | "issue";
export type OrderOperationStatus =
  | "sending"
  | "reconciling"
  | "unknown"
  | "conflict"
  | "failed"
  | "absent"
  | "completed"
  | "reconciled";
export interface OrderTransition {
  id: string;
  from: OrderStage;
  action: OrderAction;
}
export interface OrderOperation extends OrderTransition {
  number: string;
  status: OrderOperationStatus;
  message: string;
}
