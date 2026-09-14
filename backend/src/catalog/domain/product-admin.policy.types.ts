import type { CatalogProductSize, CatalogProductType } from "./catalog.types";
import type { productAdminErrorCodes } from "./product-admin.policy.constants";

export type ProductAdminErrorCode = (typeof productAdminErrorCodes)[number];

export type ProductVariantDetails = {
  size: CatalogProductSize;
  price: number;
  sortOrder: number;
  isAvailable: boolean;
};
export type AdminProductVariant = ProductVariantDetails & {
  id: string;
  productId: string;
  archivedAt: Date | null;
};
export type ProductDetails = {
  categoryId: string;
  type: CatalogProductType;
  name: string;
  description: string;
  price: number | null;
  sortOrder: number;
  isActive: boolean;
  isAvailable: boolean;
  variants: ProductVariantDetails[];
};
export type AdminProduct = Omit<ProductDetails, "variants"> & {
  id: string;
  archivedAt: Date | null;
  variants: AdminProductVariant[];
};

export type PriceChoiceDetails = {
  id?: string;
  portionLabel: string;
  price: number;
  sortOrder: number;
  isAvailable: boolean;
};

export type V3ProductDetails = {
  categoryId: string;
  name: string;
  description: string;
  price: number | null;
  portionLabel: string | null;
  priceChoices: PriceChoiceDetails[];
  sortOrder: number;
  isActive: boolean;
  isAvailable: boolean;
};

export type V3AdminPriceChoice = Required<PriceChoiceDetails> & {
  productId: string;
  archivedAt: Date | null;
};
export type V3AdminProduct = V3ProductDetails & {
  id: string;
  archivedAt: Date | null;
  priceChoices: V3AdminPriceChoice[];
};
