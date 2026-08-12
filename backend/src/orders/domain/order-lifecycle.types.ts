import type { orderLifecycleErrorCodes, orderStages, orderTransitions } from './order-lifecycle.constants';
import type { OrderSnapshotItem } from './order.types';

export type OrderStage = (typeof orderStages)[number];
export type OrderTransitionAction = keyof typeof orderTransitions;
export type OrderLifecycleErrorCode = (typeof orderLifecycleErrorCodes)[number];

export type OrderQueueItem = {
  id: string;
  number: string;
  createdAt: Date;
  totalMinor: number;
  stage: OrderStage;
};

export type OrderEvent = {
  actorId: string;
  occurredAt: Date;
  from: OrderStage;
  to: OrderStage;
};

export type OrderDetails = OrderQueueItem & {
  customer: { id: string; phoneE164: string };
  snapshot: readonly OrderSnapshotItem[];
  events: readonly OrderEvent[];
};
