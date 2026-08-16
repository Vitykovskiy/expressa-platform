import type { AvailabilityItem } from "../../../shared/api/availability.api.types";

export interface AvailabilityGroupProps {
  disabled?: boolean;
  category: string;
  items: readonly AvailabilityItem[];
}

export interface AvailabilityGroupEmits {
  "availability-change": [item: AvailabilityItem, isAvailable: boolean];
}
