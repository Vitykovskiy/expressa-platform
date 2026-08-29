import type {
  modifierSelectionTypes,
  productSizes,
  productTypes,
} from './catalog.constants';

export type CatalogProductType = (typeof productTypes)[number];

export type CatalogProductSize = (typeof productSizes)[number];

export type CatalogModifierSelectionType = (typeof modifierSelectionTypes)[number];

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
  type: CatalogProductType;
  name: string;
  description: string;
  price: number | null;
  sortOrder: number;
  isActive: boolean;
  isAvailable: boolean;
  archivedAt: Date | null;
};

export type CatalogProductVariantCandidate = {
  id: string;
  productId: string;
  size: CatalogProductSize;
  price: number;
  sortOrder: number;
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

export type PublicMenu = {
  acceptsNewOrders: boolean;
  categories: PublicMenuCategory[];
};

export type PublicMenuCategory = {
  id: string;
  name: string;
  description: string;
  products: PublicMenuProduct[];
};

export type PublicMenuProduct = {
  id: string;
  type: CatalogProductType;
  name: string;
  description: string;
  price: number | null;
  isAvailable: boolean;
  variants: PublicMenuProductVariant[];
  modifierGroups: PublicMenuModifierGroup[];
};

export type PublicMenuProductVariant = {
  id: string;
  size: CatalogProductSize;
  price: number;
  isAvailable: boolean;
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
