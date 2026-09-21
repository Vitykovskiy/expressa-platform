import type { OrderStage } from "../domain/order-lifecycle.types";
import type { OrderV3ItemDto } from "./order-v3.dto.types";

export type BackofficeOrderEventDto = {
  actorId: string;
  actorLabel: string;
  occurredAt: string;
  from: OrderStage;
  to: OrderStage;
};
export type BackofficeOrderListItemDto = {
  id: string;
  number: string;
  createdAt: string;
  total: number;
  stage: OrderStage;
};
export type BackofficeOrderDetailsDto = BackofficeOrderListItemDto & {
  customer: { id: string; phoneE164: string };
  snapshot: readonly OrderV3ItemDto[];
  events: readonly BackofficeOrderEventDto[];
};
