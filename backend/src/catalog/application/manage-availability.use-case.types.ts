import type { AvailabilityEntityType } from "./admin-catalog.repository.types";

export type AvailabilityCommand = {
  type: AvailabilityEntityType;
  id: string;
  isAvailable: boolean;
  actorId: string;
  requestId: string;
};
