import type {
  CatalogCategoryCandidate,
  CatalogCategoryModifierGroupCandidate,
  CatalogModifierGroupCandidate,
  CatalogModifierOptionCandidate,
  CatalogProductCandidate,
  CatalogProductModifierGroupCandidate,
  CatalogProductVariantCandidate,
} from "../domain/catalog.types";

export type AdminCatalogCandidates = {
  categories: CatalogCategoryCandidate[];
  products: CatalogProductCandidate[];
  productVariants: CatalogProductVariantCandidate[];
  modifierGroups: CatalogModifierGroupCandidate[];
  modifierOptions: CatalogModifierOptionCandidate[];
  categoryModifierGroups: CatalogCategoryModifierGroupCandidate[];
  productModifierGroups?: CatalogProductModifierGroupCandidate[];
  priceChoices?: AvailabilityPriceChoiceCandidate[];
  intake?: ServiceIntake;
};

export type AvailabilityPriceChoiceCandidate = {
  id: string;
  productId: string;
  portionLabel: string;
  price: number;
  sortOrder: number;
  isAvailable: boolean;
};

export type ServiceIntake = {
  acceptsNewOrders: boolean;
  updatedBy: string | null;
  updatedByLabel: string | null;
  updatedAt: Date | null;
};
export type AvailabilityEntityType =
  "product" | "variant" | "modifier" | "price_choice";
export type AvailabilityTarget = {
  type: AvailabilityEntityType;
  id: string;
  isAvailable: boolean;
};
export type AvailabilityCommand = AvailabilityTarget & {
  actorId: string;
  requestId: string;
};
export type ServiceIntakeCommand = {
  acceptsNewOrders: boolean;
  actorId: string;
  requestId: string;
};

export interface AdminCatalogRepository {
  findCandidates(): Promise<AdminCatalogCandidates>;
  findV3Candidates(): Promise<AdminCatalogV3Candidates>;
}
export type AdminCatalogV3Candidates = {
  categories: CatalogCategoryCandidate[];
  products: Array<CatalogProductCandidate & { portionLabel: string | null }>;
  priceChoices: Array<{
    id: string;
    productId: string;
    portionLabel: string;
    price: number;
    sortOrder: number;
    isAvailable: boolean;
    archivedAt: Date | null;
  }>;
  modifierGroups: CatalogModifierGroupCandidate[];
  modifierOptions: CatalogModifierOptionCandidate[];
  categoryModifierGroups: CatalogCategoryModifierGroupCandidate[];
};

export interface AvailabilityRepository {
  updateAvailability(command: AvailabilityCommand): Promise<AvailabilityTarget>;
  updateServiceIntake(command: ServiceIntakeCommand): Promise<ServiceIntake>;
}
