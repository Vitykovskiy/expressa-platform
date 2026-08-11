import type { Product } from "./catalog.types";

export interface MenuProductRowProps {
  product: Product;
  canMoveUp: boolean;
  canMoveDown: boolean;
  disabled: boolean;
  showManagementActions?: boolean;
}

export interface MenuProductRowEmits {
  edit: [product: Product];
  moveUp: [product: Product];
  moveDown: [product: Product];
}
