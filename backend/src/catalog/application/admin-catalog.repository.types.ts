import type {
  CatalogCategoryCandidate,
  CatalogCategoryModifierGroupCandidate,
  CatalogModifierGroupCandidate,
  CatalogModifierOptionCandidate,
  CatalogProductCandidate,
  CatalogProductVariantCandidate,
} from '../domain/catalog.types';

export type AdminCatalogCandidates = {
  categories: CatalogCategoryCandidate[];
  products: CatalogProductCandidate[];
  productVariants: CatalogProductVariantCandidate[];
  modifierGroups: CatalogModifierGroupCandidate[];
  modifierOptions: CatalogModifierOptionCandidate[];
  categoryModifierGroups: CatalogCategoryModifierGroupCandidate[];
};

export interface AdminCatalogRepository {
  findCandidates(): Promise<AdminCatalogCandidates>;
}
