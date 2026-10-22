export type OrderStage =
  "CREATED" | "ACCEPTED" | "PREPARING" | "READY" | "ISSUED";
export type OrdersView = "all" | "new" | "confirmed" | "ready";
export type OrderAction = "accept" | "ready" | "reject" | "issue";

export interface OrdersContext {
  readonly identityId: string;
  readonly accessToken: string;
}

export interface OrderSnapshotModifier {
  readonly modifierOptionId: string;
  readonly modifierName: string;
  readonly priceDelta: number;
}

export interface OrderSnapshotItem {
  readonly productId: string;
  readonly priceChoiceId: string | null;
  readonly productName: string;
  readonly portionLabel: string | null;
  readonly quantity: number;
  readonly unitTotal: number;
  readonly lineTotal: number;
  readonly modifiers: readonly OrderSnapshotModifier[];
}

export interface OrderHistoryEvent {
  readonly actorId: string;
  readonly actorLabel: string;
  readonly occurredAt: string;
  readonly from: OrderStage;
  readonly to: OrderStage;
}

export interface OrderCoreDto {
  readonly id: string;
  readonly number: string;
  readonly createdAt: string;
  readonly total: number;
  readonly stage: OrderStage;
  readonly customer: { readonly id: string; readonly phoneE164: string };
  readonly snapshot: readonly OrderSnapshotItem[];
  readonly events: readonly OrderHistoryEvent[];
}

export interface OrderDto extends OrderCoreDto {
  readonly customer: OrderCoreDto["customer"] & {
    readonly name: string | null;
  };
  readonly pickupSlot: {
    readonly startsAt: string;
    readonly endsAt: string;
  } | null;
  readonly rejection: {
    readonly reason: string;
    readonly at: string;
    readonly actorId: string;
  } | null;
}

export interface OrderRecord {
  readonly id: string;
  readonly number: string;
  readonly createdAt: string;
  readonly total: number;
  readonly stage: OrderStage;
  readonly customerId: string;
  readonly customerName: string | null;
  readonly customerPhone: string;
  readonly items: readonly OrderSnapshotItem[];
  readonly events: readonly OrderHistoryEvent[];
  readonly pickupSlot: OrderDto["pickupSlot"];
  readonly rejection: OrderDto["rejection"];
}

export interface OrdersQuery {
  readonly number: string | null;
  readonly stage: OrderStage | null;
  readonly view: OrdersView;
}

export type OrdersIntent =
  | {
      readonly kind: "valid";
      readonly number: string | null;
      readonly stage: OrderStage | null;
      readonly orderId: string | null;
    }
  | { readonly kind: "invalid" };

export type OrderReadOutcome =
  | { readonly kind: "loaded"; readonly order: OrderDto }
  | { readonly kind: "failed" | "cancelled" | "session-expired" | "not-found" };

export type OrdersReadOutcome =
  | { readonly kind: "loaded"; readonly orders: readonly OrderDto[] }
  | { readonly kind: "failed" | "cancelled" | "session-expired" };

export type OrderCommandOutcome =
  | { readonly kind: "confirmed"; readonly order: OrderDto }
  | {
      readonly kind:
        "conflict" | "not-found" | "rejected" | "unknown" | "session-expired";
    };

export interface OrderCommand {
  readonly order: OrderRecord;
  readonly action: OrderAction;
  readonly reason: string;
  readonly phase: "sending" | "unknown" | "checking" | "reconciled";
}

export interface OrderDialog {
  readonly orderId: string;
  readonly mode: "reject" | "issue";
  readonly reason: string;
  readonly error: string | null;
}

export interface OrderNavigationRequest {
  readonly number: string | null;
  readonly stage: OrderStage | null;
  readonly orderId: string | null;
}
