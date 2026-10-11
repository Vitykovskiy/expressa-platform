import type { DeepReadonly } from "vue";
import type {
  AvailabilityCategory,
  AvailabilityGroup,
  AvailabilityIntent,
  AvailabilityOperation,
} from "../../entities/availability/availability.types";

export interface AvailabilityTargetsProps {
  categories: DeepReadonly<AvailabilityCategory[]>;
  groups: DeepReadonly<AvailabilityGroup[]>;
  operation: DeepReadonly<AvailabilityOperation> | null;
  disabled: boolean;
  recoveryDisabled: boolean;
}
export interface AvailabilityTargetsEmits {
  change: [intent: AvailabilityIntent];
  reconcile: [];
}
