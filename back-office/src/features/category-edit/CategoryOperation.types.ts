import type { DeepReadonly } from "vue";
import type { CatalogOperation } from "../../entities/catalog/catalog.types";

export interface CategoryOperationProps {
  operation: DeepReadonly<CatalogOperation>;
  disabled: boolean;
  refreshLoading?: boolean;
}
export interface CategoryOperationEmits {
  reconcile: [];
  refresh: [];
  leave: [];
  restart: [];
}
