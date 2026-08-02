import type { Category } from "../../shared/model/customer.types";

export interface MenuRootScreenProps {
  categories: Category[];
}

export type MenuRootScreenEmits = {
  selectCategory: [categoryId: string];
};
