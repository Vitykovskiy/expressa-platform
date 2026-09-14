import type {
  CartSelectedModifierOption,
  ConfiguredCartItemDraft,
} from "@/entities/customer/model/customer.types";
import type {
  PublicMenuPriceChoice,
  PublicMenuProduct,
} from "@/shared/api/public-menu.api";
import { initialProductConfigurationQuantity } from "./product-configuration.constants";
import type {
  ProductConfiguration,
  ProductConfigurationSelectedOptions,
  ProductConfigurationTotals,
} from "./product-configuration.types";

export type {
  ProductConfiguration,
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
      optionIds:
        group.minSelect === 0
          ? []
          : group.options
              .filter(
                (option) =>
                  option.isAvailable &&
                  option.isDefault &&
                  option.priceDelta === 0,
              )
              .map((option) => option.id),
    })),
    selectedPriceChoiceId:
      (product.priceChoices ?? []).find((choice) => choice.isAvailable)?.id ??
      null,
    selectedVariantId:
      product.variants?.find(
        (variant) => variant.size === "M" && variant.isAvailable,
      )?.id ??
      product.variants?.find((variant) => variant.isAvailable)?.id ??
      null,
  };
}
export function selectProductConfigurationPriceChoice(
  configuration: ProductConfiguration,
  priceChoiceId: string,
): ProductConfiguration {
  const choice = (configuration.product.priceChoices ?? []).find(
    (candidate) => candidate.id === priceChoiceId,
  );
  return choice?.isAvailable
    ? { ...configuration, selectedPriceChoiceId: choice.id }
    : configuration;
}
/** @deprecated V2 compatibility; V3 uses price-choice IDs. */
export const selectProductConfigurationVariant = (
  configuration: ProductConfiguration,
  variantId: string,
) => {
  const variant = configuration.product.variants?.find(
    (candidate) => candidate.id === variantId,
  );
  return variant?.isAvailable
    ? { ...configuration, selectedVariantId: variant.id }
    : configuration;
};
/** @deprecated V3 public menu does not expose modifiers. */
export function toggleProductConfigurationOption(
  configuration: ProductConfiguration,
  groupId: string,
  optionId: string,
): ProductConfiguration {
  const group = configuration.product.modifierGroups.find(
    (candidate) => candidate.id === groupId,
  );
  if (
    !group ||
    !group.options.some(
      (option) => option.id === optionId && option.isAvailable,
    )
  )
    return configuration;
  const current =
    configuration.selectedModifierGroups.find(
      (item) => item.groupId === groupId,
    )?.optionIds ?? [];
  const selected = current.includes(optionId);
  const next =
    group.selectionType === "single"
      ? selected
        ? group.minSelect === 0
          ? []
          : current
        : [optionId]
      : selected
        ? current.length > group.minSelect
          ? current.filter((id) => id !== optionId)
          : current
        : current.length < group.maxSelect
          ? [...current, optionId]
          : current;
  return {
    ...configuration,
    selectedModifierGroups: configuration.selectedModifierGroups.map((item) =>
      item.groupId === groupId ? { ...item, optionIds: next } : item,
    ),
  };
}
export function setProductConfigurationQuantity(
  configuration: ProductConfiguration,
  quantity: number,
): ProductConfiguration {
  return Number.isInteger(quantity) &&
    quantity >= initialProductConfigurationQuantity
    ? { ...configuration, quantity }
    : configuration;
}
export function isProductConfigurationValid(
  configuration: ProductConfiguration,
): boolean {
  return (
    configuration.product.isAvailable &&
    Number.isInteger(configuration.quantity) &&
    configuration.quantity >= 1 &&
    getSelectedPrice(configuration) !== null &&
    getSelectedModifierOptions(configuration).valid
  );
}
export function getProductConfigurationTotals(
  configuration: ProductConfiguration,
): ProductConfigurationTotals | null {
  const price = getSelectedPrice(configuration);
  const options = getSelectedModifierOptions(configuration);
  return price === null || !options.valid
    ? null
    : {
        unitTotal:
          price +
          options.options.reduce((sum, option) => sum + option.priceDelta, 0),
        lineTotal:
          (price +
            options.options.reduce(
              (sum, option) => sum + option.priceDelta,
              0,
            )) *
          configuration.quantity,
      };
}
export function getSelectedModifierOptions(
  configuration: ProductConfiguration,
): ProductConfigurationSelectedOptions {
  const options: CartSelectedModifierOption[] = [];
  for (const group of configuration.product.modifierGroups) {
    const ids =
      configuration.selectedModifierGroups.find(
        (item) => item.groupId === group.id,
      )?.optionIds ?? [];
    if (
      ids.length < group.minSelect ||
      ids.length > group.maxSelect ||
      new Set(ids).size !== ids.length
    )
      return { options: [], valid: false };
    for (const id of ids) {
      const option = group.options.find(
        (candidate) => candidate.id === id && candidate.isAvailable,
      );
      if (!option) return { options: [], valid: false };
      options.push({
        groupId: group.id,
        id: option.id,
        name: option.name,
        priceDelta: option.priceDelta,
      });
    }
  }
  return {
    options: options.sort((a, b) => a.id.localeCompare(b.id)),
    valid: true,
  };
}
export function toCartItemDraft(
  configuration: ProductConfiguration,
): ConfiguredCartItemDraft | null {
  const totals = getProductConfigurationTotals(configuration);
  if (!isProductConfigurationValid(configuration) || totals === null)
    return null;
  const choice = getSelectedChoice(configuration);
  const selectedOptions = getSelectedModifierOptions(configuration).options;
  const legacyVariant = configuration.product.variants?.find(
    (variant) => variant.id === configuration.selectedVariantId,
  );
  if (legacyVariant && configuration.product.type === "DRINK")
    return {
      productId: configuration.product.id,
      productName: configuration.product.name,
      addons: selectedOptions.map((option) => ({
        id: option.id,
        name: option.name,
        priceRub: option.priceDelta,
      })),
      quantity: configuration.quantity,
      lineTotalRub: totals.lineTotal,
      unitTotal: totals.unitTotal,
      lineTotal: totals.lineTotal,
      selectedModifierOptions: selectedOptions,
      type: "DRINK",
      selectedVariant: {
        id: legacyVariant.id,
        size: legacyVariant.size,
        price: legacyVariant.price,
      },
      size: legacyVariant.size,
      sizePrice: legacyVariant.price,
    };
  return {
    productId: configuration.product.id,
    productName: configuration.product.name,
    addons: selectedOptions.map((option) => ({
      id: option.id,
      name: option.name,
      priceRub: option.priceDelta,
    })),
    quantity: configuration.quantity,
    lineTotalRub: totals.lineTotal,
    unitTotal: totals.unitTotal,
    lineTotal: totals.lineTotal,
    selectedModifierOptions: selectedOptions,
    type:
      (configuration.product.priceChoices ?? []).length === 0
        ? "OTHER"
        : "PRICED",
    selectedPriceChoice:
      choice === null
        ? undefined
        : {
            id: choice.id,
            portionLabel: choice.portionLabel,
            price: choice.price,
          },
    portionLabel: choice?.portionLabel ?? configuration.product.portionLabel,
    price: totals.unitTotal,
  } as ConfiguredCartItemDraft;
}
function getSelectedChoice(
  configuration: ProductConfiguration,
): PublicMenuPriceChoice | null {
  return (
    (configuration.product.priceChoices ?? []).find(
      (choice) =>
        choice.id === configuration.selectedPriceChoiceId && choice.isAvailable,
    ) ?? null
  );
}
function getSelectedPrice(configuration: ProductConfiguration): number | null {
  if ((configuration.product.priceChoices ?? []).length === 0)
    return (
      configuration.product.variants?.find(
        (variant) => variant.id === configuration.selectedVariantId,
      )?.price ?? configuration.product.price
    );
  return getSelectedChoice(configuration)?.price ?? null;
}
