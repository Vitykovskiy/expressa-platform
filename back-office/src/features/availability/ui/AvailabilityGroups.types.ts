import type {
  AvailabilityCommand,
  AvailabilityGroup,
} from "../../../entities/availability/availability.types";

export interface AvailabilityGroupsProps {
  readonly groups: readonly AvailabilityGroup[];
  readonly command: AvailabilityCommand | null;
  readonly disabled: boolean;
}
