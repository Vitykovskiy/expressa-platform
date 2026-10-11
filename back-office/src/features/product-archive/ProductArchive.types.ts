import type { DeepReadonly } from "vue";
import type {
  CatalogOperation,
  CatalogProductDto,
} from "../../entities/catalog/catalog.types";

export interface ProductArchiveProps {
  open: boolean;
  product: DeepReadonly<CatalogProductDto> | null;
  categoryName: string;
  operation: DeepReadonly<CatalogOperation> | null;
  disabled: boolean;
  confirmDisabled: boolean;
}
export interface ProductArchiveEmits {
  close: [];
  confirm: [];
  reconcile: [];
  leave: [];
  refresh: [];
}
