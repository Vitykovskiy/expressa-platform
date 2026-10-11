import type { UiSelectOption } from "../../shared/ui/UiSelect/UiSelect.types";
import type { AvailabilityMode } from "../../entities/availability/availability.types";

export interface AvailabilitySearchProps {
  mode: AvailabilityMode;
  search: string;
  categoryId: string | null;
  categories: readonly UiSelectOption[];
  loading: boolean;
  refreshDisabled: boolean;
  showRefresh: boolean;
}
export interface AvailabilitySearchEmits {
  mode: [mode: AvailabilityMode];
  search: [search: string];
  category: [id: string | null];
  refresh: [];
}
