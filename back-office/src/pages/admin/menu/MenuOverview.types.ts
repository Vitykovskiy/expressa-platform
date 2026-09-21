import type { Category, ModifierGroup, Product } from "./catalog.types";
export interface MenuOverviewProps {
  categories: readonly Category[];
  modifierGroups: readonly ModifierGroup[];
  products: readonly Product[];
  expandedCategoryIds: ReadonlySet<string>;
  highlightedCategoryId?: string | null;
  reorderSaved?: boolean;
  disabled?: boolean;
}
export interface MenuOverviewEmits {
  addModifierGroup: [];
  addCategory: [];
  addProduct: [];
  editCategory: [category: Category];
  editProduct: [product: Product];
  editModifierGroup: [group: ModifierGroup];
  reorder: [];
  toggleCategory: [category: Category];
}
