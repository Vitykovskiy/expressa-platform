import {
  maximumOrderItemQuantity,
  minimumOrderItemQuantity,
} from "./order.constants";
import {
  MenuItemUnavailableError,
  OrderIntakeClosedError,
  OrderTotalChangedError,
  OrderValidationError,
} from "./order.errors";
import type {
  OrderCatalog,
  OrderCatalogModifierGroup,
  OrderCatalogModifierOption,
  OrderCatalogProduct,
  OrderCatalogVariant,
  OrderRequest,
  OrderRequestItem,
  OrderRevalidationResult,
  OrderSnapshotItem,
  OrderSnapshotModifier,
} from "./order.types";

export function revalidateOrder(
  request: OrderRequest,
  catalog: OrderCatalog,
): OrderRevalidationResult {
  if (!catalog.acceptsNewOrders) {
    throw new OrderIntakeClosedError();
  }

  assertValidRequest(request);
  assertValidCatalog(catalog);
  const validatedItems = request.items.map((item) =>
    validateItem(item, catalog.products),
  );
  validatedItems.forEach(({ product, variant, modifiers }) =>
    assertAvailable(product, variant?.id, modifiers),
  );
  const items = validatedItems.map(({ item, product, variant, modifiers }) =>
    createSnapshot(item, product, variant, modifiers),
  );
  const total = items.reduce((sum, item) => sum + item.lineTotal, 0);

  if (!isNonNegativeAmount(total)) {
    throw new OrderValidationError();
  }
  if (request.total !== total) {
    throw new OrderTotalChangedError(total);
  }

  return Object.freeze({ total, items: Object.freeze(items) });
}

function assertValidRequest(request: OrderRequest): void {
  if (!isNonNegativeAmount(request.total) || request.items.length === 0) {
    throw new OrderValidationError();
  }

  const configurations = new Set<string>();
  for (const item of request.items) {
    const configurationKey = createConfigurationKey(item);
    if (!isValidItemShape(item) || configurations.has(configurationKey)) {
      throw new OrderValidationError();
    }
    configurations.add(configurationKey);
  }
}

function isValidItemShape(item: OrderRequestItem): boolean {
  return (
    isNonBlankString(item.productId) &&
    (item.variantId === null || isNonBlankString(item.variantId)) &&
    item.quantity >= minimumOrderItemQuantity &&
    item.quantity <= maximumOrderItemQuantity &&
    Number.isInteger(item.quantity) &&
    new Set(item.modifierOptionIds).size === item.modifierOptionIds.length &&
    item.modifierOptionIds.every(isNonBlankString)
  );
}

function validateItem(
  item: OrderRequestItem,
  products: readonly OrderCatalogProduct[],
) {
  const product = products.find((candidate) => candidate.id === item.productId);
  if (product === undefined) {
    throw new OrderValidationError();
  }

  const variant = getValidVariant(product, item.variantId);
  const modifiers = getValidModifiers(
    product.modifierGroups,
    item.modifierOptionIds,
  );

  return { item, product, variant, modifiers };
}

function createSnapshot(
  item: OrderRequestItem,
  product: OrderCatalogProduct,
  variant: OrderCatalogVariant | null,
  modifiers: readonly OrderCatalogModifierOption[],
): OrderSnapshotItem {
  const basePrice = variant === null ? product.price : variant.price;
  if (basePrice === null) {
    throw new OrderValidationError();
  }
  const unitTotal =
    basePrice +
    modifiers.reduce((sum, modifier) => sum + modifier.priceDelta, 0);
  const lineTotal = unitTotal * item.quantity;
  if (!isNonNegativeAmount(unitTotal) || !isNonNegativeAmount(lineTotal)) {
    throw new OrderValidationError();
  }

  return Object.freeze({
    productId: product.id,
    variantId: variant?.id ?? null,
    productName: product.name,
    size: variant?.size ?? null,
    quantity: item.quantity,
    unitTotal,
    lineTotal,
    modifiers: Object.freeze(modifiers.map(toSnapshotModifier)),
  });
}

function isValidProduct(product: OrderCatalogProduct): boolean {
  if (!isNonBlankString(product.id) || !isNonBlankString(product.name)) {
    return false;
  }
  if (product.type === "DRINK") {
    return (
      product.price === null &&
      product.variants.every(isValidVariant) &&
      hasUniqueValues(product.variants.map((variant) => variant.id)) &&
      hasUniqueValues(product.variants.map((variant) => variant.size))
    );
  }
  return (
    product.type === "OTHER" &&
    product.price !== null &&
    isNonNegativeAmount(product.price) &&
    product.variants.length === 0
  );
}

function getValidVariant(
  product: OrderCatalogProduct,
  variantId: string | null,
) {
  if (product.type === "OTHER") {
    if (variantId !== null) {
      throw new OrderValidationError();
    }
    return null;
  }
  if (variantId === null) {
    throw new OrderValidationError();
  }

  const variant = product.variants.find(
    (candidate) => candidate.id === variantId,
  );
  if (variant === undefined) {
    throw new OrderValidationError();
  }
  return variant;
}

function isValidVariant(variant: { id: string; price: number }): boolean {
  return isNonBlankString(variant.id) && isNonNegativeAmount(variant.price);
}

function assertValidCatalog(catalog: OrderCatalog): void {
  if (
    !hasUniqueValues(catalog.products.map((product) => product.id)) ||
    catalog.products.some(
      (product) =>
        !isValidProduct(product) ||
        !hasValidModifierGroups(product.modifierGroups),
    )
  ) {
    throw new OrderValidationError();
  }
}

function hasValidModifierGroups(
  groups: readonly OrderCatalogModifierGroup[],
): boolean {
  if (!hasUniqueValues(groups.map((group) => group.id))) {
    return false;
  }

  const optionIds: string[] = [];
  for (const group of groups) {
    if (!isValidGroup(group)) {
      return false;
    }
    for (const option of group.options) {
      if (!isValidOption(option)) {
        return false;
      }
      optionIds.push(option.id);
    }
  }

  return hasUniqueValues(optionIds);
}

function getValidModifiers(
  groups: readonly OrderCatalogModifierGroup[],
  optionIds: readonly string[],
): readonly OrderCatalogModifierOption[] {
  const optionsById = new Map<string, OrderCatalogModifierOption>();
  for (const group of groups) {
    if (!isValidGroup(group)) {
      throw new OrderValidationError();
    }
    for (const option of group.options) {
      if (!isValidOption(option) || optionsById.has(option.id)) {
        throw new OrderValidationError();
      }
      optionsById.set(option.id, option);
    }
  }

  const selectedOptions: OrderCatalogModifierOption[] = [];
  for (const id of optionIds) {
    const option = optionsById.get(id);
    if (option === undefined) {
      throw new OrderValidationError();
    }
    selectedOptions.push(option);
  }

  for (const group of groups) {
    const count = selectedOptions.filter((option) =>
      group.options.some((candidate) => candidate.id === option.id),
    ).length;
    if (count < group.minSelect || count > group.maxSelect) {
      throw new OrderValidationError();
    }
  }

  return selectedOptions;
}

function isValidGroup(group: OrderCatalogModifierGroup): boolean {
  if (
    !isNonBlankString(group.id) ||
    !Number.isInteger(group.minSelect) ||
    !Number.isInteger(group.maxSelect) ||
    group.minSelect < 0 ||
    group.maxSelect < group.minSelect ||
    (group.selectionType === "single" && group.maxSelect !== 1)
  ) {
    return false;
  }

  const defaults = group.options.filter(
    (option) => option.isAvailable && option.isDefault,
  );
  return (
    group.minSelect === 0 ||
    (defaults.length >= group.minSelect &&
      defaults.length <= group.maxSelect &&
      defaults.every((option) => option.priceDelta === 0))
  );
}

function isValidOption(option: OrderCatalogModifierOption): boolean {
  return (
    isNonBlankString(option.id) &&
    isNonBlankString(option.name) &&
    Number.isSafeInteger(option.priceDelta)
  );
}

function assertAvailable(
  product: OrderCatalogProduct,
  variantId: string | undefined,
  modifiers: readonly OrderCatalogModifierOption[],
): void {
  if (!product.isAvailable) {
    throw new MenuItemUnavailableError(product.id);
  }
  if (variantId !== undefined) {
    const variant = product.variants.find(
      (candidate) => candidate.id === variantId,
    );
    if (variant !== undefined && !variant.isAvailable) {
      throw new MenuItemUnavailableError(variant.id);
    }
  }
  const unavailableModifier = modifiers.find(
    (modifier) => !modifier.isAvailable,
  );
  if (unavailableModifier !== undefined) {
    throw new MenuItemUnavailableError(unavailableModifier.id);
  }
}

function toSnapshotModifier(
  option: OrderCatalogModifierOption,
): OrderSnapshotModifier {
  return Object.freeze({
    modifierOptionId: option.id,
    modifierName: option.name,
    priceDelta: option.priceDelta,
  });
}

function createConfigurationKey(item: OrderRequestItem): string {
  return JSON.stringify({
    productId: item.productId,
    variantId: item.variantId,
    modifierOptionIds: item.modifierOptionIds.toSorted(),
  });
}

function isNonNegativeAmount(value: number): boolean {
  return Number.isSafeInteger(value) && value >= 0;
}

function isNonBlankString(value: string): boolean {
  return value.trim() !== "";
}

function hasUniqueValues(values: readonly string[]): boolean {
  return new Set(values).size === values.length;
}
