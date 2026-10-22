export type OrderPresentationStage =
  "created" | "confirmed" | "ready" | "rejected" | "closed";

export interface OrderCardDetails {
  readonly phone: string;
  readonly createdAt: string;
  readonly pickup: string;
  readonly lines: readonly {
    readonly key: string;
    readonly label: string;
    readonly modifiers: string | null;
    readonly total: string;
  }[];
  readonly events: readonly { readonly key: string; readonly label: string }[];
  readonly rejection: string | null;
}

export interface OrderCardModel {
  readonly id: string;
  readonly number: string;
  readonly stage: OrderPresentationStage;
  readonly pickupTime: string;
  readonly customerName: string;
  readonly itemsSummary: string;
  readonly totalLabel: string;
  readonly details: OrderCardDetails;
}

export interface OrderCardProps {
  readonly order: OrderCardModel;
  readonly disabled: boolean;
  readonly pending: boolean;
  readonly expanded: boolean;
}

export interface OrderCardEmits {
  confirm: [id: string];
  reject: [id: string];
  ready: [id: string];
  issue: [id: string];
  toggleDetails: [id: string];
}
