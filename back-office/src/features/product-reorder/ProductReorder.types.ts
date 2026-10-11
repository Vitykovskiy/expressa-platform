import type { DeepReadonly } from "vue";
import type { CatalogProductDto } from "../../entities/catalog/catalog.types";

export interface ProductReorderProps {
  products: DeepReadonly<CatalogProductDto[]>;
  categoryName: string;
  dirty: boolean;
  readOnly: boolean;
  disabled: boolean;
  busy: boolean;
  attempting: boolean;
}
export interface ProductReorderEmits {
  move: [id: string, direction: -1 | 1];
  save: [];
  cancel: [];
}
