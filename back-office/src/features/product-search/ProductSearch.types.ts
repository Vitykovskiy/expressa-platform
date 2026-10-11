import type { DeepReadonly } from "vue";
import type { CategoryDto } from "../../entities/catalog/catalog.types";

export interface ProductSearchProps {
  search: string;
  categoryId: string;
  categories: DeepReadonly<CategoryDto[]>;
  disabled: boolean;
  loading: boolean;
  showRefresh: boolean;
}
export interface ProductSearchEmits {
  search: [value: string];
  category: [value: string];
  refresh: [];
}
