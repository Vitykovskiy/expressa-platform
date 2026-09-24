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
  showLabel: [label: string];
  "edit-category": [category: Category];
  edit: [product: Product];
}
