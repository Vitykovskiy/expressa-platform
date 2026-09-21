import type { CatalogModifierSelectionType } from "../../catalog/domain/catalog.types";
import type { orderErrorCodes } from "./order.constants";

export type OrderErrorCode = (typeof orderErrorCodes)[number];

export type OrderRequest = {
  total: number;
  items: readonly OrderRequestItem[];
};

export type OrderRequestItem = {
  productId: string;
  priceChoiceId: string | null;
  modifierOptionIds: readonly string[];
  quantity: number;
};

export type OrderCatalog = {
  acceptsNewOrders: boolean;
  products: readonly OrderCatalogProduct[];
};

export type OrderCatalogProduct = {
  id: string;
  name: string;
  price: number | null;
  portionLabel: string | null;
  isAvailable: boolean;
  priceChoices: readonly OrderCatalogPriceChoice[];
  modifierGroups: readonly OrderCatalogModifierGroup[];
};

export type OrderCatalogPriceChoice = {
  id: string;
  portionLabel: string;
  price: number;
  isAvailable: boolean;
};

export type OrderCatalogModifierGroup = {
  id: string;
  selectionType: CatalogModifierSelectionType;
  minSelect: number;
  maxSelect: number;
  options: readonly OrderCatalogModifierOption[];
};

export type OrderCatalogModifierOption = {
  id: string;
  name: string;
  priceDelta: number;
  isDefault: boolean;
  isAvailable: boolean;
};

export type OrderRevalidationResult = {
  total: number;
  items: readonly OrderSnapshotItem[];
};

export type OrderSnapshotItem = {
  productId: string;
  priceChoiceId: string | null;
  productName: string;
  portionLabel: string | null;
  quantity: number;
  unitTotal: number;
  lineTotal: number;
  modifiers: readonly OrderSnapshotModifier[];
};

export type OrderSnapshotModifier = {
  modifierOptionId: string;
  modifierName: string;
  priceDelta: number;
};
