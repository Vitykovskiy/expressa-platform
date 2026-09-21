export type ModifierSelectionType = "single" | "multiple";

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
  name: string;
  description: string;
  portionLabel?: string | null;
  price: number | null;
  sortOrder: number;
  isActive: boolean;
  isAvailable: boolean;
}

export interface ProductPriceChoiceSeed {
  id: string;
  productId: string;
  portionLabel: string;
  price: number;
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
  priceDelta: number;
  sortOrder: number;
  isDefault: boolean;
  isAvailable: boolean;
}

export interface CategoryModifierGroupSeed {
  categoryId: string;
  groupId: string;
  sortOrder: number;
}

export interface ProductModifierGroupSeed {
  productId: string;
  groupId: string;
  sortOrder: number;
}

export interface CatalogSeed {
  categories: readonly CategorySeed[];
  products: readonly ProductSeed[];
  productPriceChoices: readonly ProductPriceChoiceSeed[];
  modifierGroups: readonly ModifierGroupSeed[];
  modifierOptions: readonly ModifierOptionSeed[];
  categoryModifierGroups: readonly CategoryModifierGroupSeed[];
  productModifierGroups: readonly ProductModifierGroupSeed[];
}
