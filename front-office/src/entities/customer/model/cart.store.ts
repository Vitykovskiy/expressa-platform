import { defineStore } from "pinia";

import {
  cartConfigurationSeparator,
  cartStorageKey,
  cartStoreId,
  configuredCartProductTypes,
} from "./cart.store.constants";
import type { CartState, CartStorage, RepeatWarning } from "./cart.store.types";
import type {
  CartItem,
  CartVariantSelection,
  ConfiguredCartItemDraft,
  DrinkCartItem,
  OtherCartItem,
} from "./customer.types";

export const useCartStore = defineStore(cartStoreId, {
  state: (): CartState => ({ items: [], repeatWarnings: [] }),
  getters: {
    itemCount: (state) =>
      state.items.reduce((total, item) => total + item.quantity, 0),
    total: (state) =>
      state.items.reduce((total, item) => total + getLineTotal(item), 0),
  },
  actions: {
    addConfigured(
      item: ConfiguredCartItemDraft,
      storage: CartStorage = localStorage,
    ): void {
      const configurationId = createCartItemId(item);
      const existingItem = this.items.find(
        (cartItem) =>
          isConfiguredCartItem(cartItem) &&
          createCartItemId(cartItem) === configurationId,
      );

      if (existingItem === undefined) {
        const nextItem = createConfiguredCartItem(
          item,
          createAvailableCartItemId(configurationId, this.items),
        );
        this.replace([...this.items, nextItem], storage);
        return;
      }

      const quantity = existingItem.quantity + item.quantity;
      const mergedItem = {
        ...item,
        id: existingItem.id,
        quantity,
        lineTotal: item.unitTotal * quantity,
        lineTotalRub: item.unitTotal * quantity,
      };

      this.replace(
        this.items.map((cartItem) =>
          cartItem.id === existingItem.id ? mergedItem : cartItem,
        ),
        storage,
      );
    },
    restore(storage: CartStorage = localStorage): void {
      this.clearRepeatWarnings();
      const value = storage.getItem(cartStorageKey);

      if (value === null) return;

      try {
        const parsed: unknown = JSON.parse(value);

        if (!isCartItems(parsed)) {
          storage.removeItem(cartStorageKey);
          return;
        }

        this.items = parsed;
      } catch {
        storage.removeItem(cartStorageKey);
      }
    },
    replace(items: CartItem[], storage: CartStorage = localStorage): void {
      this.items = items.map(normalizeCartItem);
      this.clearRepeatWarnings();
      this.persist(storage);
    },
    clear(storage: CartStorage = localStorage): void {
      this.items = [];
      this.clearRepeatWarnings();
      storage.removeItem(cartStorageKey);
    },
    applyRepeat(
      items: CartItem[],
      warnings: RepeatWarning[],
      storage: CartStorage = localStorage,
    ): void {
      this.repeatWarnings = warnings.map((warning) => ({ ...warning }));

      if (items.length === 0) return;

      this.items = items.map(normalizeCartItem);
      this.persist(storage);
    },
    clearRepeatWarnings(): void {
      this.repeatWarnings = [];
    },
    persist(storage: CartStorage = localStorage): void {
      storage.setItem(cartStorageKey, JSON.stringify(this.items));
    },
  },
});

function isCartItems(value: unknown): value is CartItem[] {
  return Array.isArray(value) && value.every(isCartItem);
}

function isCartItem(value: unknown): value is CartItem {
  return isLegacyCartItem(value) || isConfiguredCartItem(value);
}

function isLegacyCartItem(value: unknown): boolean {
  if (!isRecord(value)) return false;

  return (
    typeof value.id === "string" &&
    typeof value.productId === "string" &&
    typeof value.productName === "string" &&
    (value.type === "drink" ||
      value.type === "food" ||
      value.type === "extra") &&
    isAddons(value.addons) &&
    isPositiveInteger(value.quantity) &&
    isInteger(value.lineTotalRub) &&
    (value.size === undefined || typeof value.size === "string") &&
    (value.sizePrice === undefined || isFiniteNumber(value.sizePrice))
  );
}

function isConfiguredCartItem(
  value: unknown,
): value is DrinkCartItem | OtherCartItem {
  if (!isConfiguredCartItemShape(value)) {
    return false;
  }

  return value.lineTotal === value.unitTotal * value.quantity;
}

function isConfiguredCartItemShape(
  value: unknown,
): value is DrinkCartItem | OtherCartItem {
  if (!isRecord(value) || typeof value.id !== "string") {
    return false;
  }

  if (!isConfiguredCartItemBase(value)) {
    return false;
  }

  if (value.type === configuredCartProductTypes[0]) {
    const selectedVariant = value.selectedVariant;
    if (!isVariantSelection(selectedVariant)) return false;

    return (
      isProductSize(value.size) &&
      value.size === selectedVariant.size &&
      isNonNegativeInteger(value.sizePrice) &&
      value.sizePrice === selectedVariant.price
    );
  }

  return (
    value.type === configuredCartProductTypes[1] &&
    value.selectedVariant === undefined &&
    value.size === undefined &&
    value.sizePrice === undefined
  );
}

function isConfiguredCartItemBase(value: Record<string, unknown>): boolean {
  return (
    typeof value.productId === "string" &&
    typeof value.productName === "string" &&
    isAddons(value.addons) &&
    isPositiveInteger(value.quantity) &&
    isNonNegativeInteger(value.lineTotalRub) &&
    isInteger(value.unitTotal) &&
    isInteger(value.lineTotal) &&
    value.lineTotalRub === value.lineTotal &&
    isSelectedModifierOptions(value.selectedModifierOptions)
  );
}

function isVariantSelection(value: unknown): value is CartVariantSelection {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    isProductSize(value.size) &&
    isNonNegativeInteger(value.price)
  );
}

function isProductSize(value: unknown): value is "S" | "M" | "L" {
  return value === "S" || value === "M" || value === "L";
}

function isSelectedModifierOptions(value: unknown): boolean {
  return (
    Array.isArray(value) &&
    value.every(
      (option) =>
        isRecord(option) &&
        typeof option.groupId === "string" &&
        typeof option.id === "string" &&
        typeof option.name === "string" &&
        isInteger(option.priceDelta),
    )
  );
}

function isAddons(value: unknown): boolean {
  return (
    Array.isArray(value) &&
    value.every(
      (addon) =>
        isRecord(addon) &&
        typeof addon.id === "string" &&
        typeof addon.name === "string" &&
        isInteger(addon.priceRub),
    )
  );
}

function isPositiveInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value > 0;
}

function isNonNegativeInteger(value: unknown): value is number {
  return isInteger(value) && value >= 0;
}

function isInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value);
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function createConfiguredCartItem(
  item: ConfiguredCartItemDraft,
  id: string,
): CartItem {
  return { ...item, id };
}

function createCartItemId(item: ConfiguredCartItemDraft): string {
  return [
    item.productId,
    item.type === configuredCartProductTypes[0]
      ? item.selectedVariant.id
      : item.type,
    ...item.selectedModifierOptions.map((option) => option.id).sort(),
  ].join(cartConfigurationSeparator);
}

function getLineTotal(item: CartItem): number {
  return isConfiguredCartItem(item) ? item.lineTotal : item.lineTotalRub;
}

function createAvailableCartItemId(
  configurationId: string,
  items: CartItem[],
): string {
  if (!items.some((item) => item.id === configurationId)) {
    return configurationId;
  }

  let suffix = 2;
  let itemId = `${configurationId}${cartConfigurationSeparator}${suffix}`;

  while (items.some((item) => item.id === itemId)) {
    suffix += 1;
    itemId = `${configurationId}${cartConfigurationSeparator}${suffix}`;
  }

  return itemId;
}

function normalizeCartItem(item: CartItem): CartItem {
  if (!isConfiguredCartItemShape(item)) {
    return item;
  }

  const lineTotal = item.unitTotal * item.quantity;

  return {
    ...item,
    lineTotal,
    lineTotalRub: lineTotal,
  };
}
