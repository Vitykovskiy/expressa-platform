import type { OrderStage } from "./order-lifecycle.types";
import type {
  SourceOrderAction,
  SourceOrderStageChange,
} from "./source-order-policy.types";
import { OrderStageConflictError } from "./order-lifecycle.errors";

export function sourceOrderTransitions(
  action: SourceOrderAction,
  stage: OrderStage,
  rejected: boolean,
): readonly SourceOrderStageChange[] {
  if (rejected) {
    throw new OrderStageConflictError();
  }
  if (action === "reject") {
    if (stage !== "CREATED") {
      throw new OrderStageConflictError();
    }
    return [];
  }
  if (stage === "ACCEPTED") {
    return [
      { from: "ACCEPTED", to: "PREPARING" },
      { from: "PREPARING", to: "READY" },
    ];
  }
  if (stage === "PREPARING") {
    return [{ from: "PREPARING", to: "READY" }];
  }
  throw new OrderStageConflictError();
}
