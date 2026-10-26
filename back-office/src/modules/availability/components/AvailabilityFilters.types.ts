import type { AvailabilityGroup } from "../availability.types";

export interface AvailabilityFiltersProps {
  readonly groups: readonly AvailabilityGroup[];
  readonly selected: string | null;
}
