export type ProductType = 'DRINK' | 'OTHER';

export type ProductSize = 'S' | 'M' | 'L';

export type ModifierSelectionType = 'single' | 'multiple';

export interface CategorySeed {
  id: string;
  name: string;
  description: string;
  sortOrder: number;
  isActive: boolean;
}

export interface ProductSeed {
  id: string;
  categoryId: string;
  type: ProductType;
  name: string;
  description: string;
  priceMinor: number | null;
  sortOrder: number;
  isActive: boolean;
  isAvailable: boolean;
}

export interface ProductVariantSeed {
  id: string;
  productId: string;
  size: ProductSize;
  priceMinor: number;
  sortOrder: number;
  isAvailable: boolean;
}

export interface ModifierGroupSeed {
  id: string;
  name: string;
  selectionType: ModifierSelectionType;
  minSelect: number;
  maxSelect: number;
  isActive: boolean;
}

export interface ModifierOptionSeed {
  id: string;
  groupId: string;
  name: string;
  priceDeltaMinor: number;
  sortOrder: number;
  isDefault: boolean;
  isAvailable: boolean;
}

export interface CategoryModifierGroupSeed {
  categoryId: string;
  groupId: string;
  sortOrder: number;
}

export interface CatalogSeed {
  categories: readonly CategorySeed[];
  products: readonly ProductSeed[];
  productVariants: readonly ProductVariantSeed[];
  modifierGroups: readonly ModifierGroupSeed[];
  modifierOptions: readonly ModifierOptionSeed[];
  categoryModifierGroups: readonly CategoryModifierGroupSeed[];
}
