import type {
  CatalogCategoryCandidate,
  CatalogCategoryModifierGroupCandidate,
  CatalogModifierGroupCandidate,
  CatalogModifierOptionCandidate,
  CatalogProductCandidate,
  CatalogProductVariantCandidate,
} from '../domain/catalog.types';

export type PublicMenuCandidates = {
  acceptsNewOrders: boolean;
  categories: CatalogCategoryCandidate[];
  products: CatalogProductCandidate[];
  productVariants: CatalogProductVariantCandidate[];
  modifierGroups: CatalogModifierGroupCandidate[];
  modifierOptions: CatalogModifierOptionCandidate[];
  categoryModifierGroups: CatalogCategoryModifierGroupCandidate[];
};

export interface PublicMenuRepository {
  findCandidates(): Promise<PublicMenuCandidates>;
}
