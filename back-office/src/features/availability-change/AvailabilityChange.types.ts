import type { DeepReadonly } from "vue";
import type {
  AvailabilityIntent,
  AvailabilityKind,
  AvailabilityOperation,
} from "../../entities/availability/availability.types";

export interface AvailabilityChangeProps {
  kind: AvailabilityKind;
  id: string | null;
  label: string;
  value: boolean;
  disabled: boolean;
  operation: DeepReadonly<AvailabilityOperation> | null;
  recoveryDisabled: boolean;
}
export interface AvailabilityChangeEmits {
  change: [intent: AvailabilityIntent];
  reconcile: [];
}
