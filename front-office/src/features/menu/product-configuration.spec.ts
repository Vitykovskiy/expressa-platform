import { describe, expect, it } from "vitest";

import {
  createProductConfiguration,
  selectProductConfigurationPriceChoice,
  toCartItemDraft,
} from "./product-configuration";
import type { PublicMenuProduct } from "@/shared/api/public-menu.api";

const product: PublicMenuProduct = {
  id: "product",
  name: "Капучино",
  description: "",
  price: null,
  portionLabel: null,
  isAvailable: true,
  priceChoices: [
    { id: "small", portionLabel: "250 мл", price: 250, isAvailable: true },
    { id: "large", portionLabel: "350 мл", price: 300, isAvailable: true },
  ],
  modifierGroups: [],
};

describe("product configuration", () => {
  it("selects the first available price choice", () => {
    expect(createProductConfiguration(product).selectedPriceChoiceId).toBe(
      "small",
    );
  });

  it("changes the selected available price choice", () => {
    const configuration = selectProductConfigurationPriceChoice(
      createProductConfiguration(product),
      "large",
    );

    expect(configuration.selectedPriceChoiceId).toBe("large");
  });

  it("creates a priced cart draft from the selected price choice", () => {
    const configuration = selectProductConfigurationPriceChoice(
      createProductConfiguration(product),
      "large",
    );

    expect(toCartItemDraft(configuration)).toMatchObject({
      price: 300,
      portionLabel: "350 мл",
      selectedPriceChoice: { id: "large" },
      type: "PRICED",
    });
  });
});
