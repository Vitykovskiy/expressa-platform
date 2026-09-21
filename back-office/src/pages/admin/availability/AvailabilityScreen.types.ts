import type {
  AvailabilityGroup,
  AvailabilityItem,
  ServiceIntake,
} from "../../../shared/api/availability.api.types";

export interface AvailabilityErrorDiagnostic {
  code: string;
  message: string;
  requestId: string | null;
  status?: number | null;
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
  accessRecoveryPending?: boolean;
  activeCategory?: string;
  error: AvailabilityScreenError | null;
  errorFocus?: boolean;
  groups: readonly AvailabilityGroup[];
  intake: ServiceIntake | null;
  loading: boolean;
  search?: string;
  saving: boolean;
}

export interface AvailabilityScreenEmits {
  "availability-change": [item: AvailabilityItem, isAvailable: boolean];
  "intake-change": [acceptsNewOrders: boolean];
  retry: [];
  "go-back": [];
  "restore-access": [];
  "update:activeCategory": [category: string];
  "update:search": [search: string];
}

export interface AvailabilityItemGroup {
  id: string;
  items: readonly AvailabilityItem[];
  name: string;
}
