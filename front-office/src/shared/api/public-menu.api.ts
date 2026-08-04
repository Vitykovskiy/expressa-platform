import {
  publicMenuPaths,
  publicMenuProductTypes,
  publicMenuSelectionTypes,
  publicMenuStatuses,
  publicMenuUuidPattern,
  publicMenuVariantSizes,
} from "./public-menu.api.constants";
import type {
  PublicDrinkMenuProduct,
  PublicDrinkMenuProductResponse,
  PublicMenu,
  PublicMenuApi,
  PublicMenuApiClient,
  PublicMenuCategory,
  PublicMenuCategoryResponse,
  PublicMenuModifierGroup,
  PublicMenuModifierGroupResponse,
  PublicMenuModifierOption,
  PublicMenuModifierOptionResponse,
  PublicMenuProduct,
  PublicMenuProductResponse,
  PublicMenuResponse,
  PublicMenuVariant,
  PublicMenuVariantResponse,
  PublicOtherMenuProduct,
  PublicOtherMenuProductResponse,
} from "./public-menu.api.types";

export type {
  PublicDrinkMenuProduct,
  PublicMenu,
  PublicMenuApi,
  PublicMenuApiClient,
  PublicMenuCategory,
  PublicMenuModifierGroup,
  PublicMenuModifierOption,
  PublicMenuProduct,
  PublicMenuVariant,
  PublicOtherMenuProduct,
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

      return toPublicMenu(response);
    },
  };
}

function isPublicMenuResponse(value: unknown): value is PublicMenuResponse {
  return (
    isRecord(value) &&
    typeof value.acceptsNewOrders === "boolean" &&
    isArrayOf(value.categories, isPublicMenuCategoryResponse)
  );
}

function isPublicMenuCategoryResponse(
  value: unknown,
): value is PublicMenuCategoryResponse {
  return (
    isRecord(value) &&
    isUuid(value.id) &&
    typeof value.name === "string" &&
    typeof value.description === "string" &&
    isArrayOf(value.products, isPublicMenuProductResponse)
  );
}

function isPublicMenuProductResponse(
  value: unknown,
): value is PublicMenuProductResponse {
  if (!isRecord(value) || !isPublicMenuProductBase(value)) {
    return false;
  }

  if (value.type === publicMenuProductTypes[0]) {
    if (
      value.priceMinor !== null ||
      !isArrayOf(value.variants, isPublicMenuVariantResponse)
    ) {
      return false;
    }

    return hasPublishedDrinkVariants(value.variants);
  }

  return (
    value.type === publicMenuProductTypes[1] &&
    isNonNegativeInteger(value.priceMinor) &&
    Array.isArray(value.variants) &&
    value.variants.length === 0
  );
}

function hasPublishedDrinkVariants(
  variants: PublicMenuVariantResponse[],
): boolean {
  return (
    variants.length > 0 &&
    variants.some((variant) => variant.isAvailable) &&
    new Set(variants.map((variant) => variant.size)).size === variants.length
  );
}

function isPublicMenuProductBase(value: Record<string, unknown>): boolean {
  return (
    isUuid(value.id) &&
    typeof value.name === "string" &&
    typeof value.description === "string" &&
    typeof value.isAvailable === "boolean" &&
    isArrayOf(value.modifierGroups, isPublicMenuModifierGroupResponse)
  );
}

function isPublicMenuVariantResponse(
  value: unknown,
): value is PublicMenuVariantResponse {
  return (
    isRecord(value) &&
    isUuid(value.id) &&
    publicMenuVariantSizes.some((size) => size === value.size) &&
    isNonNegativeInteger(value.priceMinor) &&
    typeof value.isAvailable === "boolean"
  );
}

function isPublicMenuModifierGroupResponse(
  value: unknown,
): value is PublicMenuModifierGroupResponse {
  if (!isRecord(value) || !isUuid(value.id) || typeof value.name !== "string") {
    return false;
  }

  if (
    !publicMenuSelectionTypes.some(
      (selectionType) => selectionType === value.selectionType,
    ) ||
    !isNonNegativeInteger(value.minSelect) ||
    !isNonNegativeInteger(value.maxSelect) ||
    !isArrayOf(value.options, isPublicMenuModifierOptionResponse)
  ) {
    return false;
  }

  return (
    value.minSelect <= value.maxSelect &&
    (value.selectionType !== publicMenuSelectionTypes[0] ||
      value.maxSelect === 1) &&
    hasValidDefaultOptions(value.minSelect, value.maxSelect, value.options)
  );
}

function hasValidDefaultOptions(
  minSelect: number,
  maxSelect: number,
  options: PublicMenuModifierOptionResponse[],
): boolean {
  if (minSelect === 0) {
    return true;
  }

  const availableOptions = options.filter((option) => option.isAvailable);
  const defaultOptions = availableOptions.filter((option) => option.isDefault);

  return (
    availableOptions.length >= minSelect &&
    defaultOptions.length >= minSelect &&
    defaultOptions.length <= maxSelect &&
    defaultOptions.every((option) => option.priceDeltaMinor === 0)
  );
}

function isPublicMenuModifierOptionResponse(
  value: unknown,
): value is PublicMenuModifierOptionResponse {
  return (
    isRecord(value) &&
    isUuid(value.id) &&
    typeof value.name === "string" &&
    isInteger(value.priceDeltaMinor) &&
    typeof value.isDefault === "boolean" &&
    typeof value.isAvailable === "boolean"
  );
}

function toPublicMenu(response: PublicMenuResponse): PublicMenu {
  return {
    acceptsNewOrders: response.acceptsNewOrders,
    categories: response.categories.map(toPublicMenuCategory),
  };
}

function toPublicMenuCategory(
  category: PublicMenuCategoryResponse,
): PublicMenuCategory {
  return {
    id: category.id,
    name: category.name,
    description: category.description,
    products: category.products.map(toPublicMenuProduct),
  };
}

function toPublicMenuProduct(
  product: PublicMenuProductResponse,
): PublicMenuProduct {
  if (product.type === publicMenuProductTypes[0]) {
    return toPublicDrinkMenuProduct(product);
  }

  return toPublicOtherMenuProduct(product);
}

function toPublicDrinkMenuProduct(
  product: PublicDrinkMenuProductResponse,
): PublicDrinkMenuProduct {
  return {
    id: product.id,
    type: product.type,
    name: product.name,
    description: product.description,
    priceMinor: product.priceMinor,
    isAvailable: product.isAvailable,
    variants: product.variants.map(toPublicMenuVariant),
    modifierGroups: product.modifierGroups.map(toPublicMenuModifierGroup),
  };
}

function toPublicOtherMenuProduct(
  product: PublicOtherMenuProductResponse,
): PublicOtherMenuProduct {
  return {
    id: product.id,
    type: product.type,
    name: product.name,
    description: product.description,
    priceMinor: product.priceMinor,
    isAvailable: product.isAvailable,
    variants: [],
    modifierGroups: product.modifierGroups.map(toPublicMenuModifierGroup),
  };
}

function toPublicMenuVariant(
  variant: PublicMenuVariantResponse,
): PublicMenuVariant {
  return {
    id: variant.id,
    size: variant.size,
    priceMinor: variant.priceMinor,
    isAvailable: variant.isAvailable,
  };
}

function toPublicMenuModifierGroup(
  group: PublicMenuModifierGroupResponse,
): PublicMenuModifierGroup {
  return {
    id: group.id,
    name: group.name,
    selectionType: group.selectionType,
    minSelect: group.minSelect,
    maxSelect: group.maxSelect,
    options: group.options.map(toPublicMenuModifierOption),
  };
}

function toPublicMenuModifierOption(
  option: PublicMenuModifierOptionResponse,
): PublicMenuModifierOption {
  return {
    id: option.id,
    name: option.name,
    priceDeltaMinor: option.priceDeltaMinor,
    isDefault: option.isDefault,
    isAvailable: option.isAvailable,
  };
}

function isArrayOf<T>(
  value: unknown,
  predicate: (item: unknown) => item is T,
): value is T[] {
  return Array.isArray(value) && value.every(predicate);
}

function isUuid(value: unknown): value is string {
  return typeof value === "string" && publicMenuUuidPattern.test(value);
}

function isNonNegativeInteger(value: unknown): value is number {
  return isInteger(value) && value >= 0;
}

function isInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
