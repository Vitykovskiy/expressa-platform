import type { DeepReadonly } from "vue";
import type { Catalog } from "../../entities/catalog/catalog.types";

export interface AssociationCurrentProps {
  data: DeepReadonly<Catalog>;
  categoryId: string;
}
