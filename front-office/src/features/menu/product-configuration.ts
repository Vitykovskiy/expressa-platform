import {
  publicMenuProductTypes,
  publicMenuSelectionTypes,
} from "@/shared/api/public-menu.api.constants";
import type {
  CartSelectedModifierOption,
  ConfiguredCartItemDraft,
} from "@/entities/customer/model/customer.types";
import { minorUnitsPerRub } from "@/entities/customer/model/cart.store.constants";
import {
  initialProductConfigurationQuantity,
  preferredDrinkVariantSize,
} from "./product-configuration.constants";
import type {
  ProductConfiguration,
  ProductConfigurationGroupSelection,
  ProductConfigurationSelectedOptions,
  ProductConfigurationTotals,
} from "./product-configuration.types";
import type {
  PublicMenuModifierGroup,
  PublicMenuProduct,
} from "@/shared/api/public-menu.api";

export type {
  ProductConfiguration,
  ProductConfigurationGroupSelection,
  ProductConfigurationSelectedOptions,
  ProductConfigurationTotals,
} from "./product-configuration.types";

export function createProductConfiguration(
  product: PublicMenuProduct,
): ProductConfiguration {
  return {
    product,
    quantity: initialProductConfigurationQuantity,
    selectedModifierGroups: product.modifierGroups.map((group) => ({
      groupId: group.id,
      optionIds: getDefaultOptionIds(group),
    })),
    selectedVariantId: getInitialVariantId(product),
  };
}

export function selectProductConfigurationVariant(
  configuration: ProductConfiguration,
  variantId: string,
): ProductConfiguration {
  if (configuration.product.type !== publicMenuProductTypes[0]) {
    return configuration;
  }

  const variant = configuration.product.variants.find(
    (candidate) => candidate.id === variantId,
  );

  if (variant === undefined || !variant.isAvailable) {
    return configuration;
  }

  return { ...configuration, selectedVariantId: variant.id };
}

export function toggleProductConfigurationOption(
  configuration: ProductConfiguration,
  groupId: string,
  optionId: string,
): ProductConfiguration {
  const group = configuration.product.modifierGroups.find(
    (candidate) => candidate.id === groupId,
  );

  if (group === undefined || !isAvailableOption(group, optionId)) {
    return configuration;
  }

  const currentSelection = getGroupSelection(configuration, group);
  const optionIds = getNextOptionIds(
    group,
    currentSelection.optionIds,
    optionId,
  );

  if (optionIds === currentSelection.optionIds) {
    return configuration;
  }

  return {
    ...configuration,
    selectedModifierGroups: configuration.selectedModifierGroups.map(
      (selection) =>
        selection.groupId === group.id
          ? { ...selection, optionIds }
          : selection,
    ),
  };
}

export function setProductConfigurationQuantity(
  configuration: ProductConfiguration,
  quantity: number,
): ProductConfiguration {
  if (
    !Number.isInteger(quantity) ||
    quantity < initialProductConfigurationQuantity
  ) {
    return configuration;
  }

  return { ...configuration, quantity };
}

export function isProductConfigurationValid(
  configuration: ProductConfiguration,
): boolean {
  if (
    !configuration.product.isAvailable ||
    !Number.isInteger(configuration.quantity) ||
    configuration.quantity < initialProductConfigurationQuantity ||
    !hasValidSelectedVariant(configuration)
  ) {
    return false;
  }

  return configuration.product.modifierGroups.every((group) =>
    isGroupSelectionValid(getGroupSelection(configuration, group)),
  );
}

export function getProductConfigurationTotals(
  configuration: ProductConfiguration,
): ProductConfigurationTotals | null {
  const basePriceMinor = getBasePriceMinor(configuration);
  const selectedOptions = getSelectedModifierOptions(configuration);

  if (basePriceMinor === null || !selectedOptions.valid) {
    return null;
  }

  const unitTotalMinor = selectedOptions.options.reduce(
    (total, option) => total + option.priceDeltaMinor,
    basePriceMinor,
  );

  return {
    lineTotalMinor: unitTotalMinor * configuration.quantity,
    unitTotalMinor,
  };
}

export function toCartItemDraft(
  configuration: ProductConfiguration,
): ConfiguredCartItemDraft | null {
  const totals = getProductConfigurationTotals(configuration);
  const selectedOptions = getSelectedModifierOptions(configuration);

  if (
    !isProductConfigurationValid(configuration) ||
    totals === null ||
    !selectedOptions.valid
  ) {
    return null;
  }

  const item = {
    productId: configuration.product.id,
    productName: configuration.product.name,
    addons: selectedOptions.options.map(toCartAddon),
    quantity: configuration.quantity,
    lineTotalRub: totals.lineTotalMinor / minorUnitsPerRub,
    unitTotalMinor: totals.unitTotalMinor,
    lineTotalMinor: totals.lineTotalMinor,
    selectedModifierOptions: selectedOptions.options,
  };

  if (configuration.product.type === publicMenuProductTypes[0]) {
    const selectedVariant = configuration.product.variants.find(
      (variant) => variant.id === configuration.selectedVariantId,
    );

    if (selectedVariant === undefined) {
      return null;
    }

    return {
      ...item,
      type: configuration.product.type,
      selectedVariant: {
        id: selectedVariant.id,
        size: selectedVariant.size,
        priceMinor: selectedVariant.priceMinor,
      },
      size: selectedVariant.size,
      sizePrice: selectedVariant.priceMinor / minorUnitsPerRub,
    };
  }

  return { ...item, type: configuration.product.type };
}

export function getSelectedModifierOptions(
  configuration: ProductConfiguration,
): ProductConfigurationSelectedOptions {
  const options: CartSelectedModifierOption[] = [];

  for (const group of configuration.product.modifierGroups) {
    const selection = getGroupSelection(configuration, group);

    if (!isGroupSelectionValid(selection)) {
      return { options: [], valid: false };
    }

    for (const optionId of selection.optionIds) {
      const option = group.options.find(
        (candidate) => candidate.id === optionId,
      );

      if (option === undefined) {
        return { options: [], valid: false };
      }

      options.push({
        groupId: group.id,
        id: option.id,
        name: option.name,
        priceDeltaMinor: option.priceDeltaMinor,
      });
    }
  }

  return {
    options: [...options].sort((first, second) =>
      first.id.localeCompare(second.id),
    ),
    valid: true,
  };
}

function getInitialVariantId(product: PublicMenuProduct): string | null {
  if (product.type !== publicMenuProductTypes[0]) {
    return null;
  }

  return (
    product.variants.find(
      (variant) =>
        variant.size === preferredDrinkVariantSize && variant.isAvailable,
    )?.id ??
    product.variants.find((variant) => variant.isAvailable)?.id ??
    null
  );
}

function getDefaultOptionIds(group: PublicMenuModifierGroup): string[] {
  if (group.minSelect === 0) {
    return [];
  }

  return group.options
    .filter(
      (option) =>
        option.isAvailable && option.isDefault && option.priceDeltaMinor === 0,
    )
    .map((option) => option.id);
}

function getGroupSelection(
  configuration: ProductConfiguration,
  group: PublicMenuModifierGroup,
): ProductConfigurationGroupSelection {
  const selection = configuration.selectedModifierGroups.find(
    (candidate) => candidate.groupId === group.id,
  );

  return { group, optionIds: selection?.optionIds ?? [] };
}

function getNextOptionIds(
  group: PublicMenuModifierGroup,
  optionIds: string[],
  optionId: string,
): string[] {
  const isSelected = optionIds.includes(optionId);

  if (group.selectionType === publicMenuSelectionTypes[0]) {
    if (isSelected) {
      return group.minSelect === 0 ? [] : optionIds;
    }

    return [optionId];
  }

  if (isSelected) {
    return optionIds.length > group.minSelect
      ? optionIds.filter((id) => id !== optionId)
      : optionIds;
  }

  return optionIds.length < group.maxSelect
    ? [...optionIds, optionId]
    : optionIds;
}

function hasValidSelectedVariant(configuration: ProductConfiguration): boolean {
  if (configuration.product.type !== publicMenuProductTypes[0]) {
    return configuration.selectedVariantId === null;
  }

  return configuration.product.variants.some(
    (variant) =>
      variant.id === configuration.selectedVariantId && variant.isAvailable,
  );
}

function isGroupSelectionValid(
  selection: ProductConfigurationGroupSelection,
): boolean {
  const optionIds = selection.optionIds;

  if (
    optionIds.length < selection.group.minSelect ||
    optionIds.length > selection.group.maxSelect ||
    new Set(optionIds).size !== optionIds.length
  ) {
    return false;
  }

  if (
    selection.group.selectionType === publicMenuSelectionTypes[0] &&
    optionIds.length > 1
  ) {
    return false;
  }

  return optionIds.every((optionId) =>
    isAvailableOption(selection.group, optionId),
  );
}

function isAvailableOption(
  group: PublicMenuModifierGroup,
  optionId: string,
): boolean {
  return group.options.some(
    (option) => option.id === optionId && option.isAvailable,
  );
}

function getBasePriceMinor(configuration: ProductConfiguration): number | null {
  if (configuration.product.type !== publicMenuProductTypes[0]) {
    return configuration.product.priceMinor;
  }

  return (
    configuration.product.variants.find(
      (variant) => variant.id === configuration.selectedVariantId,
    )?.priceMinor ?? null
  );
}

function toCartAddon(option: CartSelectedModifierOption) {
  return {
    id: option.id,
    name: option.name,
    priceRub: option.priceDeltaMinor / minorUnitsPerRub,
  };
}
