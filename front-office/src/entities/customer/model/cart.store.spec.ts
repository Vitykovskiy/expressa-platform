import { createPinia, setActivePinia } from "pinia";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { cartStorageKey } from "./cart.store.constants";
import { useCartStore } from "./cart.store";
import type { CartStorage } from "./cart.store.types";

const item = {
  addons: [],
  id: "item-1",
  lineTotalRub: 300,
  productId: "product-1",
  productName: "Кофе",
  quantity: 1,
  type: "drink" as const,
};

describe("cart store", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it("restores only a valid persisted cart", () => {
    const storage = createStorage(JSON.stringify([item]));
    const store = useCartStore();

    store.restore(storage);

    expect(store.items).toEqual([item]);
  });

  it("restores configured integer-minor prices with kopecks", () => {
    const configured = {
      addons: [],
      id: "tea",
      lineTotalMinor: 30550,
      lineTotalRub: 305.5,
      productId: "tea",
      productName: "Чай",
      quantity: 1,
      selectedModifierOptions: [],
      type: "OTHER" as const,
      unitTotalMinor: 30550,
    };
    const storage = createStorage(JSON.stringify([configured]));
    const store = useCartStore();
    store.restore(storage);
    expect(store.items).toEqual([configured]);
    expect(store.totalMinor).toBe(30550);
  });

  it("restores configured drinks with fractional legacy sizePrice", () => {
    const item = {
      addons: [],
      id: "drink",
      productId: "drink",
      productName: "Напиток",
      type: "DRINK" as const,
      size: "M" as const,
      sizePrice: 305.5,
      selectedVariant: { id: "m", size: "M" as const, priceMinor: 30550 },
      selectedModifierOptions: [],
      quantity: 1,
      unitTotalMinor: 30550,
      lineTotalMinor: 30550,
      lineTotalRub: 305.5,
    };
    const storage = createStorage(JSON.stringify([item]));
    const store = useCartStore();
    store.restore(storage);
    expect(store.items).toEqual([item]);
    expect(store.totalMinor).toBe(30550);
  });

  it("rejects corrupted configured totals and variant size", () => {
    const valid = {
      addons: [],
      id: "drink",
      productId: "drink",
      productName: "Напиток",
      type: "DRINK" as const,
      size: "M" as const,
      sizePrice: 305.5,
      selectedVariant: { id: "m", size: "M" as const, priceMinor: 30550 },
      selectedModifierOptions: [],
      quantity: 1,
      unitTotalMinor: 30550,
      lineTotalMinor: 30550,
      lineTotalRub: 305.5,
    };
    for (const item of [
      { ...valid, lineTotalRub: undefined },
      { ...valid, lineTotalRub: Number.NaN },
      { ...valid, lineTotalRub: 305 },
      { ...valid, size: "L" as const },
    ]) {
      const storage = createStorage(JSON.stringify([item]));
      useCartStore().restore(storage);
      expect(storage.removeItem).toHaveBeenCalledWith(cartStorageKey);
      setActivePinia(createPinia());
    }
  });

  it("removes malformed persisted cart", () => {
    const storage = createStorage('{"items":[]}');

    useCartStore().restore(storage);

    expect(storage.removeItem).toHaveBeenCalledWith(cartStorageKey);
  });

  it("persists replacement and clears explicitly", () => {
    const storage = createStorage(null);
    const store = useCartStore();

    store.replace([item], storage);
    store.clear(storage);

    expect(storage.setItem).toHaveBeenCalledWith(
      cartStorageKey,
      JSON.stringify([item]),
    );
    expect(storage.removeItem).toHaveBeenCalledWith(cartStorageKey);
    expect(store.items).toEqual([]);
  });

  it("не сохраняет предупреждения повтора в localStorage", () => {
    const storage = createStorage(null);
    const store = useCartStore();
    const warnings = [
      {
        context: "Размер M",
        productName: "Капучино",
        reason: "Размер больше недоступен.",
      },
    ];

    store.applyRepeat([item], warnings, storage);

    expect(store.repeatWarnings).toEqual(warnings);
    expect(storage.setItem).toHaveBeenCalledWith(
      cartStorageKey,
      JSON.stringify([item]),
    );
  });

  it("сбрасывает предупреждения при восстановлении корзины", () => {
    const store = useCartStore();
    const storage = createStorage(JSON.stringify([item]));

    store.applyRepeat(
      [],
      [{ productName: "Кофе", reason: "Товар больше недоступен." }],
      storage,
    );
    store.restore(storage);

    expect(store.items).toEqual([item]);
    expect(store.repeatWarnings).toEqual([]);
  });

  it("заменяет корзину и предупреждения при повторе", () => {
    const storage = createStorage(null);
    const store = useCartStore();
    const repeatItem = { ...item, id: "item-2", productName: "Чай" };

    store.replace([item], storage);
    store.applyRepeat(
      [repeatItem],
      [{ productName: "Кофе", reason: "Товар больше недоступен." }],
      storage,
    );

    expect(store.items).toEqual([repeatItem]);
    expect(store.repeatWarnings).toEqual([
      { productName: "Кофе", reason: "Товар больше недоступен." },
    ]);
  });

  it("сохраняет корзину при повторе без доступных позиций", () => {
    const storage = createStorage(null);
    const store = useCartStore();

    store.replace([item], storage);
    storage.setItem.mockClear();
    store.applyRepeat(
      [],
      [{ productName: "Кофе", reason: "Товар больше недоступен." }],
      storage,
    );

    expect(store.items).toEqual([item]);
    expect(store.repeatWarnings).toEqual([
      { productName: "Кофе", reason: "Товар больше недоступен." },
    ]);
    expect(storage.setItem).not.toHaveBeenCalled();
  });

  it("идемпотентно заменяет предупреждения следующим повтором", () => {
    const store = useCartStore();
    const storage = createStorage(null);

    store.applyRepeat(
      [],
      [{ productName: "Кофе", reason: "Товар больше недоступен." }],
      storage,
    );
    store.applyRepeat(
      [],
      [{ productName: "Кофе", reason: "Товар больше недоступен." }],
      storage,
    );

    expect(store.repeatWarnings).toEqual([
      { productName: "Кофе", reason: "Товар больше недоступен." },
    ]);

    store.applyRepeat([item], [], storage);

    expect(store.repeatWarnings).toEqual([]);
  });

  it("очищает предупреждения при прямом изменении корзины", () => {
    const store = useCartStore();
    const storage = createStorage(null);

    store.applyRepeat(
      [],
      [{ productName: "Кофе", reason: "Товар больше недоступен." }],
      storage,
    );
    store.replace([item], storage);

    expect(store.repeatWarnings).toEqual([]);

    store.applyRepeat(
      [],
      [{ productName: "Кофе", reason: "Товар больше недоступен." }],
      storage,
    );
    store.clear(storage);

    expect(store.repeatWarnings).toEqual([]);
  });

  it("очищает предупреждения при добавлении позиции", () => {
    const store = useCartStore();
    const storage = createStorage(null);

    store.applyRepeat(
      [],
      [{ productName: "Кофе", reason: "Товар больше недоступен." }],
      storage,
    );
    store.addConfigured(
      {
        addons: [],
        lineTotalMinor: 30000,
        lineTotalRub: 300,
        productId: "product-1",
        productName: "Кофе",
        quantity: 1,
        selectedModifierOptions: [],
        type: "OTHER",
        unitTotalMinor: 30000,
      },
      storage,
    );

    expect(store.repeatWarnings).toEqual([]);
  });

  it("merges a matching configured product, variant and sorted option ids", () => {
    const storage = createStorage(null);
    const store = useCartStore();

    store.addConfigured(
      {
        addons: [],
        lineTotalMinor: 30000,
        lineTotalRub: 300,
        productId: "product-1",
        productName: "Кофе",
        quantity: 1,
        selectedModifierOptions: [
          { groupId: "milk", id: "oat", name: "Овсяное", priceDeltaMinor: 0 },
          {
            groupId: "syrup",
            id: "vanilla",
            name: "Ваниль",
            priceDeltaMinor: 0,
          },
        ],
        selectedVariant: { id: "m", priceMinor: 30000, size: "M" },
        size: "M",
        sizePrice: 300,
        type: "DRINK",
        unitTotalMinor: 30000,
      },
      storage,
    );
    store.addConfigured(
      {
        addons: [],
        lineTotalMinor: 60000,
        lineTotalRub: 600,
        productId: "product-1",
        productName: "Кофе",
        quantity: 2,
        selectedModifierOptions: [
          {
            groupId: "syrup",
            id: "vanilla",
            name: "Ваниль",
            priceDeltaMinor: 0,
          },
          { groupId: "milk", id: "oat", name: "Овсяное", priceDeltaMinor: 0 },
        ],
        selectedVariant: { id: "m", priceMinor: 30000, size: "M" },
        size: "M",
        sizePrice: 300,
        type: "DRINK",
        unitTotalMinor: 30000,
      },
      storage,
    );

    expect(store).toMatchObject({ itemCount: 3, totalMinor: 90000 });
    expect(store.items).toHaveLength(1);
    expect(store.items[0]).toMatchObject({
      lineTotalMinor: 90000,
      lineTotalRub: 900,
      quantity: 3,
    });
  });

  it("пересчитывает line total configured позиции при replace", () => {
    const store = useCartStore();
    const item = {
      addons: [],
      id: "configured",
      lineTotalMinor: 30000,
      lineTotalRub: 300,
      productId: "product-1",
      productName: "Кофе",
      quantity: 2,
      selectedModifierOptions: [],
      selectedVariant: { id: "m", priceMinor: 30000, size: "M" as const },
      size: "M" as const,
      sizePrice: 300,
      type: "DRINK" as const,
      unitTotalMinor: 30000,
    };

    store.replace([item], createStorage(null));

    expect(store.items[0]).toMatchObject({
      lineTotalMinor: 60000,
      lineTotalRub: 600,
    });
  });

  it("сохраняет legacy позицию при коллизии с configured идентичностью", () => {
    const storage = createStorage(null);
    const store = useCartStore();
    const legacyItem = {
      addons: [],
      id: "product-1:m:oat:vanilla",
      lineTotalRub: 300,
      productId: "product-1",
      productName: "Старый кофе",
      quantity: 1,
      type: "drink" as const,
    };
    const configuredItem = {
      addons: [],
      lineTotalMinor: 30000,
      lineTotalRub: 300,
      productId: "product-1",
      productName: "Кофе",
      quantity: 1,
      selectedModifierOptions: [
        {
          groupId: "milk",
          id: "oat",
          name: "Овсяное",
          priceDeltaMinor: 0,
        },
        {
          groupId: "syrup",
          id: "vanilla",
          name: "Ваниль",
          priceDeltaMinor: 0,
        },
      ],
      selectedVariant: { id: "m", priceMinor: 30000, size: "M" as const },
      size: "M" as const,
      sizePrice: 300,
      type: "DRINK" as const,
      unitTotalMinor: 30000,
    };
    store.replace([legacyItem], storage);

    store.addConfigured(configuredItem, storage);
    store.addConfigured(
      {
        ...configuredItem,
        lineTotalMinor: 60000,
        lineTotalRub: 600,
        quantity: 2,
      },
      storage,
    );

    expect(store.items).toEqual(
      expect.arrayContaining([
        legacyItem,
        expect.objectContaining({
          id: "product-1:m:oat:vanilla:2",
          quantity: 3,
        }),
      ]),
    );
  });
});

function createStorage(value: string | null) {
  return {
    getItem: vi.fn(() => value),
    removeItem: vi.fn(),
    setItem: vi.fn(),
  } satisfies CartStorage;
}
