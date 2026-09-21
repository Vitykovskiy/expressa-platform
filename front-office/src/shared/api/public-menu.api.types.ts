import type { ApiClient } from "./client";

export type PublicMenuApi = { getMenu(): Promise<PublicMenu> };
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

/** Plain labels are display text, never a measurement to parse. */
export type PublicMenuProduct = {
  id: string;
  name: string;
  description: string;
  price: number | null;
  portionLabel?: string | null;
  isAvailable: boolean;
  priceChoices: PublicMenuPriceChoice[];
  modifierGroups: PublicMenuModifierGroup[];
};
export type PublicMenuPriceChoice = {
  id: string;
  portionLabel: string;
  price: number;
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
  priceDelta: number;
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
export type PublicMenuProductResponse = PublicMenuProduct;
export type PublicMenuPriceChoiceResponse = PublicMenuPriceChoice;
export type PublicMenuModifierGroupResponse = PublicMenuModifierGroup;
export type PublicMenuModifierOptionResponse = PublicMenuModifierOption;
