import type { AvailabilityItem } from "../../entities/availability/availability.types";

export interface AvailabilityToggleRowProps {
  readonly item: AvailabilityItem;
  readonly disabled: boolean;
  readonly status: string;
}
