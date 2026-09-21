import type { Category, Product } from "./catalog.types";
import type { MenuReorderScope } from "./composables/useMenuReorderDraft.types";

export interface MenuReorderPanelProps {
  categories: readonly Category[];
  products: readonly Product[];
  expandedCategoryIds: ReadonlySet<string>;
  pending?: boolean;
  error?: string | null;
}
export interface MenuReorderPanelEmits {
  cancel: [];
  "request-close": [];
  save: [scopes: readonly MenuReorderScope[]];
  "update:expandedCategoryIds": [ids: ReadonlySet<string>];
}
