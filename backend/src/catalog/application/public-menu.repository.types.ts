import type {
  CatalogCategoryCandidate,
  CatalogCategoryModifierGroupCandidate,
  CatalogModifierGroupCandidate,
  CatalogModifierOptionCandidate,
  CatalogProductCandidate,
  CatalogProductVariantCandidate,
  CatalogProductModifierGroupCandidate,
} from "../domain/catalog.types";

export type PublicMenuCandidates = {
  acceptsNewOrders: boolean;
  categories: CatalogCategoryCandidate[];
  products: CatalogProductCandidate[];
  productVariants: CatalogProductVariantCandidate[];
  modifierGroups: CatalogModifierGroupCandidate[];
  modifierOptions: CatalogModifierOptionCandidate[];
  categoryModifierGroups: Array<
    CatalogCategoryModifierGroupCandidate & { productId?: string }
  >;
  productModifierGroups?: CatalogProductModifierGroupCandidate[];
};

export interface PublicMenuRepository {
  findCandidates(): Promise<PublicMenuCandidates>;
  findV3Candidates(): Promise<PublicMenuV3Candidates>;
}

export type PublicMenuV3Candidates = {
  acceptsNewOrders: boolean;
  categories: CatalogCategoryCandidate[];
  products: CatalogProductCandidate[];
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
