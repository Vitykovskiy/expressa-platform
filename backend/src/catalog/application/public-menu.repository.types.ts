import type {
  CatalogCategoryCandidate,
  CatalogCategoryModifierGroupCandidate,
  CatalogModifierGroupCandidate,
  CatalogModifierOptionCandidate,
  CatalogProductCandidate,
  CatalogProductModifierGroupCandidate,
} from "../domain/catalog.types";

export interface PublicMenuRepository {
  findV3Candidates(): Promise<PublicMenuV3Candidates>;
}

export type PublicMenuV3Candidates = {
  acceptsNewOrders: boolean;
  categories: CatalogCategoryCandidate[];
  products: Array<CatalogProductCandidate & { portionLabel: string | null }>;
  modifierGroups: CatalogModifierGroupCandidate[];
  modifierOptions: CatalogModifierOptionCandidate[];
  categoryModifierGroups: CatalogCategoryModifierGroupCandidate[];
  productModifierGroups: CatalogProductModifierGroupCandidate[];
  priceChoices: Array<{
    id: string;
    productId: string;
    portionLabel: string;
    price: number;
    sortOrder: number;
    isAvailable: boolean;
    archivedAt: Date | null;
  }>;
};
