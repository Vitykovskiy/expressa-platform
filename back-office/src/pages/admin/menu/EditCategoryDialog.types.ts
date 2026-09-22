import type { Category } from "./catalog.types";
import type {
  CategoryFormData,
  CategoryFormField,
} from "./AddCategoryDialog.types";

export interface EditCategoryDialogProps {
  archivePending?: boolean;
  disabled: boolean;
  category: Category | null;
  fieldErrors?: Partial<Record<CategoryFormField, string>>;
  categories?: readonly Category[];
}

export interface EditCategoryDialogEmits {
  save: [data: CategoryFormData];
  archive: [categoryId: string];
  cancel: [];
}
