import type { ApiClient } from "./client";

export type PublicMenuApi = {
  getMenu(): Promise<PublicMenu>;
};

export type PublicMenuApiClient = Pick<ApiClient, "request">;

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

export type PublicMenuProduct = PublicDrinkMenuProduct | PublicOtherMenuProduct;

export type PublicDrinkMenuProduct = PublicMenuProductBase & {
  type: "DRINK";
  priceMinor: null;
  variants: PublicMenuVariant[];
};

export type PublicOtherMenuProduct = PublicMenuProductBase & {
  type: "OTHER";
  priceMinor: number;
  variants: [];
};

export type PublicMenuProductBase = {
  id: string;
  name: string;
  description: string;
  isAvailable: boolean;
  modifierGroups: PublicMenuModifierGroup[];
};

export type PublicMenuVariant = {
  id: string;
  size: "S" | "M" | "L";
  priceMinor: number;
  isAvailable: boolean;
};

export type PublicMenuModifierGroup = {
  id: string;
  name: string;
  selectionType: "single" | "multiple";
  minSelect: number;
  maxSelect: number;
  options: PublicMenuModifierOption[];
};

export type PublicMenuModifierOption = {
  id: string;
  name: string;
  priceDeltaMinor: number;
  isDefault: boolean;
  isAvailable: boolean;
};

export type PublicMenuResponse = {
  acceptsNewOrders: boolean;
  categories: PublicMenuCategoryResponse[];
};

export type PublicMenuCategoryResponse = {
  id: string;
  name: string;
  description: string;
  products: PublicMenuProductResponse[];
};

export type PublicMenuProductResponse =
  PublicDrinkMenuProductResponse | PublicOtherMenuProductResponse;

export type PublicDrinkMenuProductResponse = PublicMenuProductResponseBase & {
  type: "DRINK";
  priceMinor: null;
  variants: PublicMenuVariantResponse[];
};

export type PublicOtherMenuProductResponse = PublicMenuProductResponseBase & {
  type: "OTHER";
  priceMinor: number;
  variants: [];
};

export type PublicMenuProductResponseBase = {
  id: string;
  name: string;
  description: string;
  isAvailable: boolean;
  modifierGroups: PublicMenuModifierGroupResponse[];
};

export type PublicMenuVariantResponse = {
  id: string;
  size: "S" | "M" | "L";
  priceMinor: number;
  isAvailable: boolean;
};

export type PublicMenuModifierGroupResponse = {
  id: string;
  name: string;
  selectionType: "single" | "multiple";
  minSelect: number;
  maxSelect: number;
  options: PublicMenuModifierOptionResponse[];
};

export type PublicMenuModifierOptionResponse = {
  id: string;
  name: string;
  priceDeltaMinor: number;
  isDefault: boolean;
  isAvailable: boolean;
};
