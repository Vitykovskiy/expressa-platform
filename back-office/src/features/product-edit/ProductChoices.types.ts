import type { DeepReadonly } from "vue";
import type {
  ProductChoiceDraft,
  ProductChoiceField,
  ProductErrors,
} from "../../entities/catalog/catalog.types";

export interface ProductChoicesProps {
  choices: DeepReadonly<ProductChoiceDraft[]>;
  errors: DeepReadonly<ProductErrors["choices"]>;
  disabled: boolean;
}
export interface ProductChoicesEmits {
  field: [key: number, field: ProductChoiceField, value: string | boolean];
  add: [];
  remove: [key: number];
  move: [key: number, direction: -1 | 1];
}
