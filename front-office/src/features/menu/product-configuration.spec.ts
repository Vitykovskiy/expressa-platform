import { describe, expect, it } from "vitest";

import {
  createProductConfiguration,
  getProductConfigurationTotals,
  getSelectedModifierOptions,
  isProductConfigurationValid,
  selectProductConfigurationVariant,
  setProductConfigurationQuantity,
  toCartItemDraft,
  toggleProductConfigurationOption,
} from "./product-configuration";
import type { PublicMenuProduct } from "@/shared/api/public-menu.api";

describe("product configuration", () => {
  it("выбирает доступный M, иначе первый доступный вариант в серверном порядке", () => {
    expect(createProductConfiguration(drink).selectedVariantId).toBe("m");
    expect(
      createProductConfiguration({
        ...drink,
        variants: [
          { ...drink.variants[0], id: "s", isAvailable: false },
          { ...drink.variants[1], id: "l", size: "L" },
        ],
      }).selectedVariantId,
    ).toBe("l");
  });

  it("не выбирает вариант для OTHER", () => {
    const configuration = createProductConfiguration(other);

    expect(configuration.selectedVariantId).toBeNull();
    expect(toCartItemDraft(configuration)).toMatchObject({ type: "OTHER" });
  });

  it("предвыбирает только бесплатные доступные default для обязательной группы", () => {
    const configuration = createProductConfiguration(drink);

    expect(configuration.selectedModifierGroups).toEqual([
      { groupId: "milk", optionIds: ["milk-regular"] },
      { groupId: "syrup", optionIds: [] },
    ]);
  });

  it("заменяет single, снимает optional и ограничивает multiple min/max", () => {
    let configuration = createProductConfiguration(drink);

    configuration = toggleProductConfigurationOption(
      configuration,
      "milk",
      "milk-oat",
    );
    expect(getSelection(configuration, "milk")).toEqual(["milk-oat"]);

    configuration = toggleProductConfigurationOption(
      configuration,
      "milk",
      "milk-oat",
    );
    expect(getSelection(configuration, "milk")).toEqual(["milk-oat"]);

    configuration = toggleProductConfigurationOption(
      configuration,
      "syrup",
      "vanilla",
    );
    configuration = toggleProductConfigurationOption(
      configuration,
      "syrup",
      "caramel",
    );
    configuration = toggleProductConfigurationOption(
      configuration,
      "syrup",
      "hazelnut",
    );
    expect(getSelection(configuration, "syrup")).toEqual([
      "vanilla",
      "caramel",
    ]);

    configuration = toggleProductConfigurationOption(
      configuration,
      "syrup",
      "vanilla",
    );
    expect(getSelection(configuration, "syrup")).toEqual(["caramel"]);
  });

  it("не нарушает minimum required multiple при снятии option", () => {
    const configuration = createProductConfiguration({
      ...drink,
      modifierGroups: [
        {
          ...drink.modifierGroups[1],
          minSelect: 1,
          options: [
            { ...drink.modifierGroups[1]!.options[0], isDefault: true },
          ],
        },
      ],
    });
    const changed = toggleProductConfigurationOption(
      configuration,
      "syrup",
      "vanilla",
    );

    expect(getSelection(changed, "syrup")).toEqual(["vanilla"]);
  });

  it("игнорирует недоступный вариант и option, а недопустимая ручная конфигурация невалидна", () => {
    let configuration = createProductConfiguration(drink);

    configuration = selectProductConfigurationVariant(configuration, "s");
    configuration = toggleProductConfigurationOption(
      configuration,
      "milk",
      "milk-unavailable",
    );

    expect(configuration.selectedVariantId).toBe("m");
    expect(getSelection(configuration, "milk")).toEqual(["milk-regular"]);
    expect(
      isProductConfigurationValid({
        ...configuration,
        selectedModifierGroups: [
          { groupId: "milk", optionIds: ["milk-unavailable"] },
          { groupId: "syrup", optionIds: [] },
        ],
      }),
    ).toBe(false);
  });

  it("считает integer ruble totals и создаёт только валидный discriminated draft", () => {
    let configuration = createProductConfiguration(drink);
    configuration = toggleProductConfigurationOption(
      configuration,
      "milk",
      "milk-oat",
    );
    configuration = toggleProductConfigurationOption(
      configuration,
      "syrup",
      "vanilla",
    );
    configuration = setProductConfigurationQuantity(configuration, 2);

    expect(getProductConfigurationTotals(configuration)).toEqual({
      lineTotal: 760,
      unitTotal: 380,
    });
    expect(toCartItemDraft(configuration)).toMatchObject({
      lineTotal: 760,
      selectedModifierOptions: [
        { groupId: "milk", id: "milk-oat" },
        { groupId: "syrup", id: "vanilla" },
      ],
      selectedVariant: { id: "m", size: "M" },
      type: "DRINK",
      unitTotal: 380,
    });
  });

  it("не создаёт draft для недоступного товара или неразрешимой обязательной группы", () => {
    const unavailable = createProductConfiguration({
      ...drink,
      isAvailable: false,
    });
    const missingRequiredSelection = {
      ...createProductConfiguration(drink),
      selectedModifierGroups: [
        { groupId: "milk", optionIds: [] },
        { groupId: "syrup", optionIds: [] },
      ],
    };

    expect(toCartItemDraft(unavailable)).toBeNull();
    expect(toCartItemDraft(missingRequiredSelection)).toBeNull();
    expect(getSelectedModifierOptions(missingRequiredSelection).valid).toBe(
      false,
    );
  });
});

const drink = {
  id: "drink",
  type: "DRINK",
  name: "Капучино",
  description: "Классический",
  price: null,
  isAvailable: true,
  variants: [
    { id: "s", size: "S", price: 280, isAvailable: false },
    { id: "m", size: "M", price: 300, isAvailable: true },
  ],
  modifierGroups: [
    {
      id: "milk",
      name: "Молоко",
      selectionType: "single",
      minSelect: 1,
      maxSelect: 1,
      options: [
        {
          id: "milk-regular",
          name: "Обычное",
          priceDelta: 0,
          isDefault: true,
          isAvailable: true,
        },
        {
          id: "milk-oat",
          name: "Овсяное",
          priceDelta: 80,
          isDefault: false,
          isAvailable: true,
        },
        {
          id: "milk-unavailable",
          name: "Кокосовое",
          priceDelta: 80,
          isDefault: false,
          isAvailable: false,
        },
      ],
    },
    {
      id: "syrup",
      name: "Сироп",
      selectionType: "multiple",
      minSelect: 0,
      maxSelect: 2,
      options: [
        {
          id: "vanilla",
          name: "Ваниль",
          priceDelta: 0,
          isDefault: false,
          isAvailable: true,
        },
        {
          id: "caramel",
          name: "Карамель",
          priceDelta: 10,
          isDefault: false,
          isAvailable: true,
        },
        {
          id: "hazelnut",
          name: "Фундук",
          priceDelta: 10,
          isDefault: false,
          isAvailable: true,
        },
      ],
    },
  ],
} satisfies PublicMenuProduct;

const other = {
  id: "other",
  type: "OTHER",
  name: "Круассан",
  description: "С маслом",
  price: 180,
  isAvailable: true,
  variants: [],
  modifierGroups: [],
} satisfies PublicMenuProduct;

function getSelection(
  configuration: ReturnType<typeof createProductConfiguration>,
  groupId: string,
): string[] {
  return (
    configuration.selectedModifierGroups.find(
      (selection) => selection.groupId === groupId,
    )?.optionIds ?? []
  );
}
