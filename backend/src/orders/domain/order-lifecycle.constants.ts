import type { OrderStage } from "./order-lifecycle.types";

export const orderStages = [
  "CREATED",
  "ACCEPTED",
  "PREPARING",
  "READY",
  "ISSUED",
] as const;

export const orderTransitions = {
  accept: { from: "CREATED", to: "ACCEPTED" },
  startPreparing: { from: "ACCEPTED", to: "PREPARING" },
  markReady: { from: "PREPARING", to: "READY" },
  issue: { from: "READY", to: "ISSUED" },
} as const satisfies Record<string, { from: OrderStage; to: OrderStage }>;

export const orderLifecycleErrorCodes = [
  "ORDER_NOT_FOUND",
  "ORDER_STAGE_CONFLICT",
] as const;
