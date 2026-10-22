import type { OrderStage } from "./order-lifecycle.types";
export type SourceOrderAction = "ready" | "reject";
export type SourceOrderStageChange = { from: OrderStage; to: OrderStage };
