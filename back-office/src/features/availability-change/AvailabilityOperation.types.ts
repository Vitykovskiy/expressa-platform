import type { DeepReadonly } from "vue";
import type { AvailabilityOperation } from "../../entities/availability/availability.types";

export interface AvailabilityOperationProps {
  operation: DeepReadonly<AvailabilityOperation>;
  disabled: boolean;
}
export interface AvailabilityOperationEmits {
  reconcile: [];
}
