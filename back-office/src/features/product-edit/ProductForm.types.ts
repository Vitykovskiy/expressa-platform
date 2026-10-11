import type { DeepReadonly } from "vue";
import type {
  CategoryDto,
  CatalogChoiceDto,
  ProductDraft,
  ProductErrors,
} from "../../entities/catalog/catalog.types";

export interface ProductFormProps {
  draft: DeepReadonly<ProductDraft>;
  baselineChoices: DeepReadonly<CatalogChoiceDto[]>;
  categories: DeepReadonly<CategoryDto[]>;
  errors: DeepReadonly<ProductErrors>;
  title: string;
  categoryName: string;
  creating: boolean;
  readOnly: boolean;
  disabled: boolean;
  mutationDisabled: boolean;
  dirty: boolean;
  attempting: boolean;
  busy: boolean;
  canArchive: boolean;
  confirming: boolean;
}
export interface ProductFormEmits {
  draft: [draft: ProductDraft];
  mode: [mode: ProductDraft["mode"]];
  addChoice: [];
  removeChoice: [key: number];
  restoreChoice: [key: number];
  moveChoice: [key: number, direction: -1 | 1];
  save: [];
  cancel: [];
  archive: [];
}
