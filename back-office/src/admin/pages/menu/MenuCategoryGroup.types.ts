import type { Category, Product } from "./catalog.types";

export interface MenuCategoryGroupProps {
  category: Category;
  products: readonly Product[];
  expanded: boolean;
  canMoveUp: boolean;
  canMoveDown: boolean;
  disabled: boolean;
}

export interface MenuCategoryGroupEmits {
  toggle: [category: Category];
  "edit-category": [category: Category];
  moveUp: [category: Category];
  moveDown: [category: Category];
  edit: [product: Product];
  moveProductUp: [product: Product];
  moveProductDown: [product: Product];
}
