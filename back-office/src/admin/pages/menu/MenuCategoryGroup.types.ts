import type { MenuItem } from "../../shared/ui/Admin.types";

export interface MenuCategoryGroupProps {
  category: string;
  items: readonly MenuItem[];
  expanded: boolean;
}

export interface MenuCategoryGroupEmits {
  toggle: [category: string];
  "edit-category": [category: string];
  edit: [product: MenuItem];
}
