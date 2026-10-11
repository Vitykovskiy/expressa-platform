import type { DeepReadonly } from "vue";
import type { CatalogOperation } from "../../entities/catalog/catalog.types";

export interface ModifierOperationProps {
  operation: DeepReadonly<CatalogOperation>;
  disabled: boolean;
  refreshLoading?: boolean;
}
export interface ModifierOperationEmits {
  reconcile: [];
  refresh: [];
  leave: [];
  restart: [];
}
