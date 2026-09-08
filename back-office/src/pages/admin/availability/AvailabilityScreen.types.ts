import type {
  AvailabilityGroup,
  AvailabilityItem,
  ServiceIntake,
} from "../../../shared/api/availability.api.types";

export interface AvailabilityErrorDiagnostic {
  code: string;
  message: string;
  requestId: string | null;
}

export type AvailabilityScreenError =
  | ({ kind: "read" } & AvailabilityErrorDiagnostic)
  | ({ kind: "intake" } & AvailabilityErrorDiagnostic)
  | ({
      kind: "item";
      label: string;
      sublabel: string;
    } & AvailabilityErrorDiagnostic);

export interface AvailabilityScreenProps {
  error: AvailabilityScreenError | null;
  groups: readonly AvailabilityGroup[];
  intake: ServiceIntake | null;
  loading: boolean;
  saving: boolean;
}

export interface AvailabilityScreenEmits {
  "availability-change": [item: AvailabilityItem, isAvailable: boolean];
  "intake-change": [acceptsNewOrders: boolean];
  retry: [];
}

export interface AvailabilityItemGroup {
  id: string;
  items: readonly AvailabilityItem[];
  name: string;
}
