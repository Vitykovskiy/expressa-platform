import type { PublicMenuCategory } from "../../../shared/api/public-menu.api";

export interface MenuGroupScreenProps {
  category?: PublicMenuCategory;
}

export type MenuGroupScreenEmits = {
  returnToMenu: [];
  selectProduct: [productId: string];
};
