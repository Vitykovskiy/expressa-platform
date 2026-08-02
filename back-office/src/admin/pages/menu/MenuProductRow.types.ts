import type { MenuItem } from "../../shared/ui/Admin.types";

export interface MenuProductRowProps {
  product: MenuItem;
}

export interface MenuProductRowEmits {
  edit: [product: MenuItem];
}
