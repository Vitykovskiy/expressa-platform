import type {
  AvailabilityChangeEvent,
  MenuItem,
} from "../../../shared/ui/admin/Admin.types";

export interface AvailabilityGroupProps {
  category: string;
  items: readonly MenuItem[];
}

export interface AvailabilityGroupEmits {
  "availability-change": [event: AvailabilityChangeEvent];
}
