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
  return (
    isRecord(value) &&
    uuid(value.id) &&
    typeof value.name === "string" &&
    typeof value.description === "string" &&
    typeof value.isAvailable === "boolean" &&
    validModifierGroups(value.modifierGroups) &&
    validPricing(value)
  );
}
function validModifierGroups(value: unknown): boolean {
  if (!Array.isArray(value)) return false;
  const groupIds = new Set<string>();
  const optionIds = new Set<string>();
  return value.every((group) => validModifierGroup(group, groupIds, optionIds));
}
function validModifierGroup(
  value: unknown,
  groupIds: Set<string>,
  optionIds: Set<string>,
): boolean {
  if (
    !isRecord(value) ||
    !uuid(value.id) ||
    groupIds.has(value.id) ||
    typeof value.name !== "string" ||
    (value.selectionType !== "single" && value.selectionType !== "multiple") ||
    typeof value.minSelect !== "number" ||
    typeof value.maxSelect !== "number" ||
    !Number.isInteger(value.minSelect) ||
    !Number.isInteger(value.maxSelect) ||
    value.minSelect < 0 ||
    value.maxSelect < value.minSelect ||
    (value.selectionType === "single" && value.maxSelect !== 1) ||
    !Array.isArray(value.options) ||
    !value.options.every(isModifierOption)
  )
    return false;

  const availableOptions = value.options.filter((option) => option.isAvailable);
  const defaultOptions = availableOptions.filter((option) => option.isDefault);
  const freeDefaultOptions = defaultOptions.filter(
    (option) => option.priceDelta === 0,
  );
  if (
    availableOptions.length < value.minSelect ||
    (value.minSelect > 0 &&
      (defaultOptions.length < value.minSelect ||
        defaultOptions.length > value.maxSelect ||
        defaultOptions.some((option) => option.priceDelta !== 0) ||
        freeDefaultOptions.length < value.minSelect)) ||
    value.options.some(
      (option) => optionIds.has(option.id) || !optionIds.add(option.id),
    )
  )
    return false;

  groupIds.add(value.id);
  return true;
}
function isModifierOption(value: unknown): value is {
  id: string;
  name: string;
  priceDelta: number;
  isDefault: boolean;
  isAvailable: boolean;
} {
  return (
    isRecord(value) &&
    uuid(value.id) &&
    typeof value.name === "string" &&
    nonNegative(value.priceDelta) &&
    typeof value.isDefault === "boolean" &&
    typeof value.isAvailable === "boolean"
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
function validPricing(value: Record<string, unknown>): boolean {
  if (
    !nullablePrice(value.price) ||
    !nullableString(value.portionLabel) ||
    !arrayOf(value.priceChoices, isChoice)
  )
    return false;

  const choices = value.priceChoices;
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
  return {
    ...product,
    priceChoices: (product.priceChoices ?? []).map((choice) => ({ ...choice })),
    modifierGroups: product.modifierGroups.map((group) => ({
      ...group,
      options: group.options.map((option) => ({ ...option })),
    })),
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
