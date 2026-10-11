import type { OrderAction, OrderStage } from "./order.types";

export const orderStages: readonly OrderStage[] = [
  "CREATED",
  "ACCEPTED",
  "PREPARING",
  "READY",
  "ISSUED",
];
export const stageLabels: Record<OrderStage, string> = {
  CREATED: "Новый",
  ACCEPTED: "Принят",
  PREPARING: "Готовится",
  READY: "Готов",
  ISSUED: "Выдан",
};
export const orderPollMs = 5000;
export const orderNumberLimit = 64;
export const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const orderPhonePattern = /^\+[1-9]\d{1,14}$/;
export const timestampPattern =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/;

export const orderTransitions: Record<
  OrderAction,
  { from: OrderStage; to: OrderStage; path: string }
> = {
  accept: { from: "CREATED", to: "ACCEPTED", path: "accept" },
  startPreparing: {
    from: "ACCEPTED",
    to: "PREPARING",
    path: "start-preparing",
  },
  markReady: { from: "PREPARING", to: "READY", path: "mark-ready" },
  issue: { from: "READY", to: "ISSUED", path: "issue" },
};
export const nextOrderAction: Record<OrderStage, OrderAction | null> = {
  CREATED: "accept",
  ACCEPTED: "startPreparing",
  PREPARING: "markReady",
  READY: "issue",
  ISSUED: null,
};
export const commandTotalMaximum = 2147483647;
