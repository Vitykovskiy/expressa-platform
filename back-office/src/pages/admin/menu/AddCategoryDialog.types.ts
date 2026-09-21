import type {
  CatalogFormSaveOutcome,
  CatalogStoreError,
} from "./catalog.types";
import type { Category } from "./catalog.types";

export type CategoryFormField = "name" | "description" | "isActive";

export interface CategoryFormData {
  name: string;
  description: string;
  isActive: boolean;
}

export interface AddCategoryDialogProps {
  disabled: boolean;
  fieldErrors?: Partial<Record<CategoryFormField, string>>;
  saveError?: CatalogStoreError | null;
  saveOutcome?: CatalogFormSaveOutcome;
  categories?: readonly Category[];
}

export interface AddCategoryDialogEmits {
  confirm: [data: CategoryFormData];
  cancel: [];
  refresh: [];
}
