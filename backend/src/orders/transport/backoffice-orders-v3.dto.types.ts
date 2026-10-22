import type { OrderMetadataDto } from "./order-metadata.dto.types";
import type { OrderQueueView } from "../domain/order-metadata.types";
import type { OrderV3ItemDto } from "./order-v3.dto.types";
import type { BackofficeOrderEventDto } from "./backoffice-orders.dto.types";

export type BackofficeOrderV3Dto = OrderMetadataDto & {
  id: string;
  number: string;
  createdAt: string;
  total: number;
  stage: string;
  customer: { id: string; phoneE164: string; name: string | null };
  snapshot: OrderV3ItemDto[];
  events: BackofficeOrderEventDto[];
};
export type BackofficeOrdersV3QueryDto = {
  stage?: "CREATED" | "ACCEPTED" | "PREPARING" | "READY" | "ISSUED";
  number?: string;
  view?: OrderQueueView;
};
