import type { CategoryDto } from "../../entities/catalog/catalog.types";

export interface CategoryListProps {
  categories: readonly Readonly<CategoryDto>[];
  selectedId: string | null;
  disabled: boolean;
}
export interface CategoryListEmits {
  select: [id: string];
  associations: [id: string];
}
