import type { Category, Product } from "./catalog.types";

export interface MenuCategoryGroupProps {
  category: Category;
  products: readonly Product[];
  expanded: boolean;
  disabled: boolean;
  highlighted?: boolean;
}

export interface MenuCategoryGroupEmits {
  toggle: [category: Category];
  "edit-category": [category: Category];
  edit: [product: Product];
}
