import type { OrderV3ItemDto } from "./order-v3.dto.types";
export type BackofficeOrderV3Dto = {
  id: string;
  number: string;
  createdAt: string;
  total: number;
  stage: string;
  snapshot: OrderV3ItemDto[];
};
export type BackofficeOrdersV3QueryDto = {
  stage?: "CREATED" | "ACCEPTED" | "PREPARING" | "READY" | "ISSUED";
  number?: string;
};
