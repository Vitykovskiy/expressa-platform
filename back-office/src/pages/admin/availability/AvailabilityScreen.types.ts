import type {
  AvailabilityChangeEvent,
  MenuItem,
} from "../../../shared/ui/admin/Admin.types";

export interface AvailabilityScreenProps {
  menuItems: readonly MenuItem[];
}

export interface AvailabilityScreenEmits {
  "availability-change": [event: AvailabilityChangeEvent];
}

export interface AvailabilityItemGroup {
  category: string;
  items: MenuItem[];
}
