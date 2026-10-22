export interface NativeOrderIntent {
  readonly type: "expressa-order-click";
  readonly id: string;
  readonly orderId: string;
  readonly lifetime: string;
  readonly expiresAt: number;
}

export type NativeIntentAction = "claim" | "inspect" | "consume" | "release";
