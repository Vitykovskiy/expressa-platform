import type { DeepReadonly } from "vue";
import type {
  Catalog,
  ProductDraft,
  ProductErrors,
  ProductTask,
} from "../../entities/catalog/catalog.types";

export interface ProductWorkspaceProps {
  data: DeepReadonly<Catalog>;
  task: DeepReadonly<ProductTask> | null;
  errors: DeepReadonly<ProductErrors>;
  search: string;
  categoryId: string;
  loading: boolean;
  disabled: boolean;
  mutationDisabled: boolean;
  readOnly: boolean;
  dirty: boolean;
  busy: boolean;
  attempting: boolean;
  reconciled: boolean;
  confirming: boolean;
  showRefresh: boolean;
}
export interface ProductWorkspaceEmits {
  search: [value: string];
  category: [value: string];
  refresh: [];
  create: [];
  select: [id: string];
  reorder: [];
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
