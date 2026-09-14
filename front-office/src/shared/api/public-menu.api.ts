import {
  publicMenuPaths,
  publicMenuStatuses,
  publicMenuUuidPattern,
} from "./public-menu.api.constants";
import type {
  PublicMenu,
  PublicMenuApi,
  PublicMenuApiClient,
  PublicMenuCategory,
  PublicMenuCategoryResponse,
  PublicMenuPriceChoice,
  PublicMenuProduct,
  PublicMenuProductResponse,
  PublicMenuResponse,
} from "./public-menu.api.types";

export type {
  PublicMenu,
  PublicMenuApi,
  PublicMenuApiClient,
  PublicMenuCategory,
  PublicMenuPriceChoice,
  PublicMenuProduct,
  PublicMenuModifierGroup,
  PublicMenuVariant,
} from "./public-menu.api.types";

export function createPublicMenuApi(
  client: PublicMenuApiClient,
): PublicMenuApi {
  return {
    async getMenu(): Promise<PublicMenu> {
      const response = await client.request(
        publicMenuPaths.getMenu,
        isPublicMenuResponse,
        { expectedStatus: publicMenuStatuses.success, method: "GET" },
      );
      return {
        acceptsNewOrders: response.acceptsNewOrders,
        categories: response.categories.map(toCategory),
      };
    },
  };
}
function isPublicMenuResponse(value: unknown): value is PublicMenuResponse {
  return (
    isRecord(value) &&
    typeof value.acceptsNewOrders === "boolean" &&
    arrayOf(value.categories, isCategory)
  );
}
function isCategory(value: unknown): value is PublicMenuCategoryResponse {
  return (
    isRecord(value) &&
    uuid(value.id) &&
    typeof value.name === "string" &&
    typeof value.description === "string" &&
    arrayOf(value.products, isProduct)
  );
}
function isProduct(value: unknown): value is PublicMenuProductResponse {
  if (isRecord(value) && (value.type === "DRINK" || value.type === "OTHER")) {
    return (
      uuid(value.id) &&
      typeof value.name === "string" &&
      typeof value.description === "string" &&
      typeof value.isAvailable === "boolean" &&
      (value.type === "DRINK"
        ? value.price === null && validVariants(value.variants)
        : nonNegative(value.price) &&
          Array.isArray(value.variants) &&
          value.variants.length === 0) &&
      validModifierGroups(value.modifierGroups)
    );
  }
  return (
    isRecord(value) &&
    uuid(value.id) &&
    typeof value.name === "string" &&
    typeof value.description === "string" &&
    nullablePrice(value.price) &&
    nullableString(value.portionLabel) &&
    typeof value.isAvailable === "boolean" &&
    arrayOf(value.priceChoices, isChoice) &&
    validPricing(value as PublicMenuProductResponse)
  );
}
function validVariants(value: unknown): boolean {
  return (
    Array.isArray(value) &&
    value.length > 0 &&
    value.some(
      (variant) => isRecord(variant) && variant.isAvailable === true,
    ) &&
    new Set(value.map((variant) => (isRecord(variant) ? variant.size : null)))
      .size === value.length &&
    value.every(
      (variant) =>
        isRecord(variant) &&
        uuid(variant.id) &&
        (variant.size === "S" ||
          variant.size === "M" ||
          variant.size === "L") &&
        nonNegative(variant.price) &&
        typeof variant.isAvailable === "boolean",
    )
  );
}
function validModifierGroups(value: unknown): boolean {
  return (
    Array.isArray(value) &&
    value.every(
      (group) =>
        isRecord(group) &&
        uuid(group.id) &&
        typeof group.name === "string" &&
        (group.selectionType === "single" ||
          group.selectionType === "multiple") &&
        typeof group.minSelect === "number" &&
        typeof group.maxSelect === "number" &&
        Number.isInteger(group.minSelect) &&
        Number.isInteger(group.maxSelect) &&
        group.minSelect >= 0 &&
        group.maxSelect >= group.minSelect &&
        (group.selectionType !== "single" || group.maxSelect === 1) &&
        Array.isArray(group.options) &&
        group.options.every(
          (option) =>
            isRecord(option) &&
            uuid(option.id) &&
            typeof option.name === "string" &&
            nonNegative(option.priceDelta) &&
            typeof option.isDefault === "boolean" &&
            typeof option.isAvailable === "boolean",
        ),
    )
  );
}
function isChoice(value: unknown): value is PublicMenuPriceChoice {
  return (
    isRecord(value) &&
    uuid(value.id) &&
    typeof value.portionLabel === "string" &&
    nonNegative(value.price) &&
    typeof value.isAvailable === "boolean"
  );
}
function validPricing(value: PublicMenuProductResponse): boolean {
  const choices = value.priceChoices ?? [];
  return choices.length === 0
    ? value.price !== null
    : value.price === null &&
        value.portionLabel === null &&
        choices.length >= 2;
}
function toCategory(category: PublicMenuCategoryResponse): PublicMenuCategory {
  return { ...category, products: category.products.map(toProduct) };
}
function toProduct(product: PublicMenuProductResponse): PublicMenuProduct {
  const legacy = product as PublicMenuProduct;
  if (legacy.type === "DRINK" || legacy.type === "OTHER") {
    return legacy;
  }
  return {
    ...product,
    priceChoices: (product.priceChoices ?? []).map((choice) => ({ ...choice })),
    modifierGroups: [],
  };
}
function arrayOf<T>(
  value: unknown,
  predicate: (item: unknown) => item is T,
): value is T[] {
  return Array.isArray(value) && value.every(predicate);
}
function uuid(value: unknown): value is string {
  return typeof value === "string" && publicMenuUuidPattern.test(value);
}
function nonNegative(value: unknown): value is number {
  return (
    typeof value === "number" &&
    Number.isInteger(value) &&
    value >= 0 &&
    value <= 2_147_483_647
  );
}
function nullablePrice(value: unknown): value is number | null {
  return value === null || nonNegative(value);
}
function nullableString(value: unknown): value is string | null {
  return value === null || typeof value === "string";
}
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
