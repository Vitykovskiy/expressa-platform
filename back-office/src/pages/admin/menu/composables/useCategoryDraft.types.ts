import type { Category } from "../catalog.types";
import type {
  CategoryFormData,
  CategoryFormField,
} from "../AddCategoryDialog.types";

export interface UseCategoryDraftOptions {
  categories: () => readonly Category[];
  excludedCategoryId?: () => string | undefined;
  initial: () => CategoryFormData;
}

export interface CategoryDraftValidation {
  name?: string;
  description?: string;
}

export type CategoryDraftField = CategoryFormField;
