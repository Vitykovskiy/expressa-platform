import type { CategoryDto } from "../../entities/catalog/catalog.types";

export interface CategoryReorderProps {
  categories: readonly Readonly<CategoryDto>[];
  dirty: boolean;
  readOnly: boolean;
  disabled: boolean;
  busy: boolean;
  attempting: boolean;
}
export interface CategoryReorderEmits {
  move: [id: string, direction: -1 | 1];
  save: [];
  cancel: [];
}
