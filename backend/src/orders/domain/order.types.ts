import type {
  CatalogModifierSelectionType,
  CatalogProductSize,
  CatalogProductType,
} from '../../catalog/domain/catalog.types';
import type { orderErrorCodes } from './order.constants';

export type OrderErrorCode = (typeof orderErrorCodes)[number];

export type OrderRequest = {
  total: number;
  items: readonly OrderRequestItem[];
};

export type OrderRequestItem = {
  productId: string;
  variantId: string | null;
  modifierOptionIds: readonly string[];
  quantity: number;
};

export type OrderCatalog = {
  acceptsNewOrders: boolean;
  products: readonly OrderCatalogProduct[];
};

export type OrderCatalogProduct = {
  id: string;
  type: CatalogProductType;
  name: string;
  price: number | null;
  isAvailable: boolean;
  variants: readonly OrderCatalogVariant[];
  modifierGroups: readonly OrderCatalogModifierGroup[];
};

export type OrderCatalogVariant = {
  id: string;
  size: CatalogProductSize;
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
  variantId: string | null;
  productName: string;
  size: CatalogProductSize | null;
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
