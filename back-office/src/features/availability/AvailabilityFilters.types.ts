import type { AvailabilityGroup } from "../../entities/availability/availability.types";

export interface AvailabilityFiltersProps {
  readonly groups: readonly AvailabilityGroup[];
  readonly selected: string | null;
}
