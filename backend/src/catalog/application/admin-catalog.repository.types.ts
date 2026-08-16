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
  intake?: ServiceIntake;
};

export type ServiceIntake = { acceptsNewOrders: boolean; updatedBy: string | null; updatedAt: Date | null };
export type AvailabilityEntityType = 'product' | 'variant' | 'modifier';
export type AvailabilityTarget = { type: AvailabilityEntityType; id: string; isAvailable: boolean };
export type AvailabilityCommand = AvailabilityTarget & { actorId: string; requestId: string };
export type ServiceIntakeCommand = { acceptsNewOrders: boolean; actorId: string; requestId: string };

export interface AdminCatalogRepository {
  findCandidates(): Promise<AdminCatalogCandidates>;
}

export interface AvailabilityRepository {
  updateAvailability(command: AvailabilityCommand): Promise<AvailabilityTarget>;
  updateServiceIntake(command: ServiceIntakeCommand): Promise<ServiceIntake>;
}
