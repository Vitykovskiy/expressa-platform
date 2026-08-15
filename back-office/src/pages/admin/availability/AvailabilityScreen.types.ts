import type {
  AvailabilityGroup,
  AvailabilityItem,
  ServiceIntake,
} from "../../../shared/api/availability.api.types";
import type { ScreenError } from "../../../shared/ui/screen-error";

export interface AvailabilityScreenProps {
  error: ScreenError | null;
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
