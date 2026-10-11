import type { DeepReadonly } from "vue";
import type {
  CatalogOptionDto,
  ModifierAggregate,
} from "../../entities/catalog/catalog.types";

export interface ModifierReorderProps {
  name: string;
  current: DeepReadonly<ModifierAggregate> | null;
  reconciled: boolean;
  options: DeepReadonly<CatalogOptionDto[]>;
  active: boolean;
  dirty: boolean;
  readOnly: boolean;
  disabled: boolean;
  busy: boolean;
  attempting: boolean;
}
export interface ModifierReorderEmits {
  move: [id: string, direction: -1 | 1];
  save: [];
  cancel: [];
}
