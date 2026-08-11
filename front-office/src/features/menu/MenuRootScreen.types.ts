import type { PublicMenuCategory } from "@/shared/api/public-menu.api";

export interface MenuRootScreenProps {
  categories: PublicMenuCategory[];
}

export type MenuRootScreenEmits = {
  selectCategory: [categoryId: string];
};
