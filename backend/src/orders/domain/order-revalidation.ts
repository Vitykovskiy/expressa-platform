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
  OrderRequest,
  OrderRequestItem,
  OrderRevalidationResult,
  OrderSnapshotModifier,
} from "./order.types";

export function revalidateOrder(
  request: OrderRequest,
  catalog: OrderCatalog,
): OrderRevalidationResult {
  if (!catalog.acceptsNewOrders) throw new OrderIntakeClosedError();
  assertValidRequest(request);
  const items = request.items.map((item) => {
    const product = catalog.products.find(
      (candidate) => candidate.id === item.productId,
    );
    if (product === undefined || !product.isAvailable)
      throw new MenuItemUnavailableError(item.productId);

    const choice = getPriceChoice(product, item.priceChoiceId);
    const modifiers = getValidModifiers(
      product.modifierGroups,
      item.modifierOptionIds,
    );
    assertAvailable(product, modifiers);
    const basePrice = choice?.price ?? product.price;
    if (basePrice === null) throw new OrderValidationError();
    const unitTotal =
      basePrice +
      modifiers.reduce((sum, modifier) => sum + modifier.priceDelta, 0);
    const lineTotal = unitTotal * item.quantity;
    if (!isNonNegativeAmount(unitTotal) || !isNonNegativeAmount(lineTotal))
      throw new OrderValidationError();
    return Object.freeze({
      productId: product.id,
      priceChoiceId: choice?.id ?? null,
      productName: product.name,
      portionLabel: choice?.portionLabel ?? product.portionLabel,
      quantity: item.quantity,
      unitTotal,
      lineTotal,
      modifiers: Object.freeze(modifiers.map(toSnapshotModifier)),
    });
  });
  const total = items.reduce((sum, item) => sum + item.lineTotal, 0);
  if (!isNonNegativeAmount(total)) throw new OrderValidationError();
  if (request.total !== total) throw new OrderTotalChangedError(total);
  return Object.freeze({ total, items: Object.freeze(items) });
}

function assertValidRequest(request: OrderRequest): void {
  if (!isNonNegativeAmount(request.total) || request.items.length === 0)
    throw new OrderValidationError();
  const configurations = new Set<string>();
  for (const item of request.items) {
    const configurationKey = createConfigurationKey(item);
    if (!isValidItemShape(item) || configurations.has(configurationKey))
      throw new OrderValidationError();
    configurations.add(configurationKey);
  }
}

function isValidItemShape(item: OrderRequestItem): boolean {
  return (
    isNonBlankString(item.productId) &&
    (item.priceChoiceId === null || isNonBlankString(item.priceChoiceId)) &&
    item.quantity >= minimumOrderItemQuantity &&
    item.quantity <= maximumOrderItemQuantity &&
    Number.isInteger(item.quantity) &&
    new Set(item.modifierOptionIds).size === item.modifierOptionIds.length &&
    item.modifierOptionIds.every(isNonBlankString)
  );
}

function getPriceChoice(
  product: OrderCatalogProduct,
  priceChoiceId: string | null,
) {
  const choices = product.priceChoices;
  const choice =
    priceChoiceId === null
      ? null
      : choices.find((candidate) => candidate.id === priceChoiceId);
  if (
    (choices.length === 0 && priceChoiceId !== null) ||
    (choices.length >= 2 && choice === undefined) ||
    choices.length === 1 ||
    (choices.length >= 2 && !choice?.isAvailable) ||
    (choices.length === 0 && product.price === null)
  )
    throw new OrderValidationError();
  return choice ?? null;
}

function getValidModifiers(
  groups: readonly OrderCatalogModifierGroup[],
  optionIds: readonly string[],
): readonly OrderCatalogModifierOption[] {
  const optionsById = new Map<string, OrderCatalogModifierOption>();
  for (const group of groups) {
    if (!isValidGroup(group)) throw new OrderValidationError();
    for (const option of group.options) {
      if (!isValidOption(option) || optionsById.has(option.id))
        throw new OrderValidationError();
      optionsById.set(option.id, option);
    }
  }
  const selectedOptions: OrderCatalogModifierOption[] = [];
  for (const id of optionIds) {
    const option = optionsById.get(id);
    if (option === undefined) throw new OrderValidationError();
    selectedOptions.push(option);
  }
  for (const group of groups) {
    const count = selectedOptions.filter((option) =>
      group.options.some((candidate) => candidate.id === option.id),
    ).length;
    if (count < group.minSelect || count > group.maxSelect)
      throw new OrderValidationError();
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
  )
    return false;
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
  modifiers: readonly OrderCatalogModifierOption[],
): void {
  if (!product.isAvailable) throw new MenuItemUnavailableError(product.id);
  const unavailableModifier = modifiers.find(
    (modifier) => !modifier.isAvailable,
  );
  if (unavailableModifier !== undefined)
    throw new MenuItemUnavailableError(unavailableModifier.id);
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
    priceChoiceId: item.priceChoiceId,
    modifierOptionIds: item.modifierOptionIds.toSorted(),
  });
}

function isNonNegativeAmount(value: number): boolean {
  return Number.isSafeInteger(value) && value >= 0;
}

function isNonBlankString(value: string): boolean {
  return value.trim() !== "";
}
