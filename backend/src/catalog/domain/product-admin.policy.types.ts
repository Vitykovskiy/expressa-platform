import type { productAdminErrorCodes } from "./product-admin.policy.constants";

export type ProductAdminErrorCode = (typeof productAdminErrorCodes)[number];

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
