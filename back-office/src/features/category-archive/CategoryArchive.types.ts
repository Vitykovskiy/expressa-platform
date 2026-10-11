import type { DeepReadonly } from "vue";
import type { CatalogOperation } from "../../entities/catalog/catalog.types";

export interface CategoryArchiveProps {
  open: boolean;
  name: string;
  operation: DeepReadonly<CatalogOperation> | null;
  disabled: boolean;
  confirmDisabled: boolean;
}
export interface CategoryArchiveEmits {
  close: [];
  confirm: [];
  reconcile: [];
  refresh: [];
  leave: [];
}
