import type {
  orderLifecycleErrorCodes,
  orderStages,
  orderTransitions,
} from "./order-lifecycle.constants";
import type { OrderSnapshotItem } from "./order.types";

export type OrderStage = (typeof orderStages)[number];
export type OrderTransitionAction = keyof typeof orderTransitions;
export type OrderLifecycleErrorCode = (typeof orderLifecycleErrorCodes)[number];

import type { OrderMetadata } from "./order-metadata.types";

export type OrderQueueItem = OrderMetadata & {
  id: string;
  number: string;
  createdAt: Date;
  total: number;
  stage: OrderStage;
};

export type OrderEvent = {
  actorId: string;
  actorLabel: string;
  occurredAt: Date;
  from: OrderStage;
  to: OrderStage;
};

export type OrderDetails = OrderQueueItem & {
  customer: { id: string; phoneE164: string; name?: string | null };
  snapshot: readonly OrderSnapshotItem[];
  events: readonly OrderEvent[];
};
