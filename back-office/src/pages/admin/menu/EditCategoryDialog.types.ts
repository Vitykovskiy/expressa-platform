import type {
  CatalogFormSaveOutcome,
  CatalogStoreError,
  Category,
} from "./catalog.types";
import type {
  CategoryFormData,
  CategoryFormField,
} from "./AddCategoryDialog.types";

export interface EditCategoryDialogProps {
  disabled: boolean;
  category: Category | null;
  fieldErrors?: Partial<Record<CategoryFormField, string>>;
  saveError?: CatalogStoreError | null;
  saveOutcome?: CatalogFormSaveOutcome;
}

export interface EditCategoryDialogEmits {
  save: [data: CategoryFormData];
  archive: [categoryId: string];
  cancel: [];
  refresh: [];
}
