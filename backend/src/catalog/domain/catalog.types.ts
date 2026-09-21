import type { modifierSelectionTypes } from "./catalog.constants";

export type CatalogModifierSelectionType =
  (typeof modifierSelectionTypes)[number];

export type CatalogCategoryCandidate = {
  id: string;
  name: string;
  description: string;
  sortOrder: number;
  isActive: boolean;
  archivedAt: Date | null;
};

export type CatalogProductCandidate = {
  id: string;
  categoryId: string;
  name: string;
  description: string;
  price: number | null;
  sortOrder: number;
  isActive: boolean;
  isAvailable: boolean;
  archivedAt: Date | null;
};

export type CatalogModifierGroupCandidate = {
  id: string;
  name: string;
  selectionType: CatalogModifierSelectionType;
  minSelect: number;
  maxSelect: number;
  isActive: boolean;
  archivedAt: Date | null;
};

export type CatalogModifierOptionCandidate = {
  id: string;
  groupId: string;
  name: string;
  priceDelta: number;
  sortOrder: number;
  isDefault: boolean;
  isAvailable: boolean;
  archivedAt: Date | null;
};

export type CatalogCategoryModifierGroupCandidate = {
  categoryId: string;
  groupId: string;
  sortOrder: number;
};

export type CatalogProductModifierGroupCandidate = {
  productId: string;
  groupId: string;
  sortOrder: number;
};

export type PublicMenuModifierGroup = {
  id: string;
  name: string;
  selectionType: CatalogModifierSelectionType;
  minSelect: number;
  maxSelect: number;
  options: PublicMenuModifierOption[];
};

export type PublicMenuModifierOption = {
  id: string;
  name: string;
  priceDelta: number;
  isDefault: boolean;
  isAvailable: boolean;
};

/** The v3 pricing projection intentionally has no physical-unit semantics. */
export type PublicMenuV3PriceChoice = {
  id: string;
  portionLabel: string;
  price: number;
  isAvailable: boolean;
};

export type PublicMenuV3Product = {
  id: string;
  name: string;
  description: string;
  price: number | null;
  portionLabel: string | null;
  isAvailable: boolean;
  priceChoices: PublicMenuV3PriceChoice[];
  modifierGroups: PublicMenuModifierGroup[];
};

export type PublicMenuV3Category = {
  id: string;
  name: string;
  description: string;
  products: PublicMenuV3Product[];
};

export type PublicMenuV3 = {
  acceptsNewOrders: boolean;
  categories: PublicMenuV3Category[];
};
