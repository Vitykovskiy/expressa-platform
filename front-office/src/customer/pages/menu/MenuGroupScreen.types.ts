import type { Category } from "../../shared/model/customer.types";

export interface MenuGroupScreenProps {
  category?: Category;
}

export type MenuGroupScreenEmits = {
  selectProduct: [productId: string];
};
