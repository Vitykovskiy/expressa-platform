import type { DeepReadonly } from "vue";
import type {
  CatalogProductDto,
  CategoryDto,
} from "../../entities/catalog/catalog.types";

export interface ProductListProps {
  products: DeepReadonly<CatalogProductDto[]>;
  categories: DeepReadonly<CategoryDto[]>;
  selectedId: string | null;
  disabled: boolean;
}
export interface ProductListEmits {
  select: [id: string];
}
