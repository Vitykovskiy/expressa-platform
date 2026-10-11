import type { DeepReadonly } from "vue";
import type { CatalogOperation } from "../../entities/catalog/catalog.types";

export interface AssociationOperationProps {
  operation: DeepReadonly<CatalogOperation>;
  disabled: boolean;
  refreshLoading?: boolean;
}
export interface AssociationOperationEmits {
  reconcile: [];
  refresh: [];
  leave: [];
}
