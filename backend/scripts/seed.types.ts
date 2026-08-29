export type ProductType = "DRINK" | "OTHER";

export type ProductSize = "S" | "M" | "L";

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

export type E2eSeedScenario =
  | "canonical"
  | "customer-new"
  | "customer-existing"
  | "intake-closed"
  | "modifier-unavailable"
  | "product-unavailable"
  | "size-unavailable"
  | "catalog-mutation"
  | "order-created"
  | "order-accepted"
  | "order-preparing"
  | "order-ready"
  | "order-issued"
  | "order-snapshot"
  | "order-repeat-unavailable"
  | "order-repeat-partial"
  | "customer-history"
  | "queue-populated";

export type SeedOrderStage =
  "CREATED" | "ACCEPTED" | "PREPARING" | "READY" | "ISSUED";

export interface E2eSeedScenarioDefinition {
  customerState: "new" | "existing";
  secondCustomerState: "new" | "existing";
  acceptsNewOrders: boolean;
  unavailableTarget: "none" | "modifier" | "product" | "size";
  orderStages: readonly SeedOrderStage[];
  customerHistoryCount: number;
  includeForeignOrder: boolean;
}
