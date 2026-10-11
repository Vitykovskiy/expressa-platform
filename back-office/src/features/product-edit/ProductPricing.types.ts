import type { DeepReadonly } from "vue";
import type {
  CatalogChoiceDto,
  ProductDraft,
  ProductErrors,
} from "../../entities/catalog/catalog.types";

export interface ProductPricingProps {
  draft: DeepReadonly<ProductDraft>;
  baselineChoices: DeepReadonly<CatalogChoiceDto[]>;
  errors: DeepReadonly<ProductErrors>;
  disabled: boolean;
  readOnly: boolean;
}
export interface ProductPricingEmits {
  draft: [draft: ProductDraft];
  mode: [mode: ProductDraft["mode"]];
  addChoice: [];
  removeChoice: [key: number];
  restoreChoice: [key: number];
  moveChoice: [key: number, direction: -1 | 1];
}
